'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/utils/translation-context';
import { Loader2, Edit, Trash, Eye, Star, ShieldAlert, Clock, PlusCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/utils/auth-hooks';
import { CarListing, ListingStatus } from '@/types/listing';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
//import { ListingService } from '@/services/listings';
import { FaCarSide } from 'react-icons/fa';
import axios from 'axios';

// Formatear fecha relativa
const formatRelativeDate = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
};

// Formatear moneda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function MyListingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Record<ListingStatus, CarListing[]>>({
    active: [],
    pending: [],
    sold: [],
    expired: [],
    draft: [],
    rejected: [],
    approved: [],
    changes_requested: [],
    reserved: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar anuncios del usuario (optimizado)
  const loadUserListings = useCallback(async () => {
    // Si no hay usuario o no está autenticado, no hacemos nada
    if (!user?.id || !isAuthenticated) {
      console.log('No se cargan anuncios: usuario o autenticación no disponible', { userId: user?.id, isAuthenticated });
      return;
    }
    
    // Si ya cargamos una vez, no volvemos a cargar
    if (hasLoadedRef.current) {
      console.log('Omitiendo carga redundante de anuncios, ya cargados previamente');
      return;
    }
    
    try {
      setLoading(true);
      setLoadError(null);
      console.log('Iniciando carga de anuncios del usuario:', user.id);
      
      // Establecer un timeout para evitar carga infinita
      loadTimeoutRef.current = setTimeout(() => {
        console.log('Timeout de carga alcanzado');
        setLoading(false);
        setLoadError('La carga tomó demasiado tiempo. Por favor, actualiza la página.');
      }, 15000); // 15 segundos de timeout
      
      // Agregar control de errores para la llamada a getUserListings
      /* if (!ListingService || typeof ListingService.getUserListings !== 'function') {
        throw new Error('ListingService o getUserListings no disponible');
      } */
      
      console.log('Llamando a ListingService.getUserListings...');
      //const userListings = await ListingService.getUserListings(user.id);
      const response = await axios.post('/api/listings', {
        methodSelected: 'getListings',
        sentParams: {
          userId: user.id
        }
      });
      const userListings = response.data;
      console.log('Anuncios cargados exitosamente:', Object.keys(userListings).map(k => `${k}: ${userListings[k as ListingStatus].length}`));
      
      // Limpiar el timeout ya que la carga fue exitosa
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      
      setListings(userListings);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Error detallado cargando anuncios:', error);
      // Error más descriptivo
      let errorMessage = 'No se pudieron cargar tus anuncios. Por favor, intenta de nuevo.';
      if (error instanceof Error) {
        errorMessage += ` Error: ${error.message}`;
      }
      setLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      // Asegurarnos de que siempre salimos del estado de carga
      console.log('Finalizando proceso de carga de anuncios');
      setLoading(false);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    }
  }, [user?.id, isAuthenticated]);

  // Efecto para cargar anuncios solo cuando tenemos un usuario autenticado y no hay una carga en progreso
  useEffect(() => {
    console.log('useEffect evaluado:', {
      isAuthenticated,
      hasUser: !!user,
      authLoading,
      loading,
      hasLoadedBefore: hasLoadedRef.current
    });
    
    // Solo iniciar la carga cuando:
    // 1. El usuario está autenticado
    // 2. Tenemos un objeto user
    // 3. La autenticación ya terminó de cargar
    // 4. No hay una carga de anuncios en progreso
    // 5. No hemos cargado los anuncios anteriormente
    const shouldLoadListings = 
      isAuthenticated && 
      !!user && 
      !authLoading && 
      !loading && 
      !hasLoadedRef.current;
    
    if (shouldLoadListings) {
      console.log('Iniciando carga de anuncios desde useEffect');
      loadUserListings();
    }
  }, [isAuthenticated, user, authLoading, loading, loadUserListings]);

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  // Eliminar un anuncio
  const handleDeleteListing = async () => {
    if (!selectedListingId || !user) return;
    
    try {
      setIsDeleting(true);
      // Mostrar indicador de carga
      toast.info('Eliminando anuncio...');
      
      //await ListingService.deleteListing(selectedListingId, user.id);
      await axios.post('/api/listings', {
        methodSelected: 'deleteListing',
        sentParams: {
          listingId: selectedListingId,
          userId: user.id
        }
      });
      // Actualizar el estado local usando un callback para asegurar el estado más reciente
      setListings(prevListings => {
        const updatedListings = { ...prevListings };
        const listingStatus = Object.keys(updatedListings).find((status) =>
          updatedListings[status as ListingStatus].some(
            (listing) => listing.id === selectedListingId,
          ),
        ) as ListingStatus;
        
        if (listingStatus) {
          updatedListings[listingStatus] = updatedListings[listingStatus].filter(
            (listing) => listing.id !== selectedListingId,
          );
        }
        
        return updatedListings;
      });
      
      toast.success('Anuncio eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando anuncio:', error);
      toast.error('No se pudo eliminar el anuncio. Por favor, intenta de nuevo.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setSelectedListingId(null);
    }
  };

  // Cambiar estado de un anuncio
  const handleStatusChange = async (listingId: string, newStatus: ListingStatus) => {
    if (!user) return;
    
    try {
      setActionLoading(listingId);
      // Obtener el nombre del estado para el mensaje
      const statusName =
        {
          active: 'activado',
          sold: 'marcado como vendido',
          draft: 'guardado como borrador',
          expired: 'marcado como expirado',
          pending: 'marcado como pendiente',
          approved: 'aprobado',
          rejected: 'rechazado',
          changes_requested: 'marcado para revisión',
          reserved: 'marcado como reservado',
        }[newStatus] || newStatus;
      
      // Mostrar indicador de carga
      toast.info(`Cambiando estado del anuncio a "${statusName}"...`);
      
      // Llamar al servicio para cambiar el estado
      //await ListingService.changeListingStatus(listingId, newStatus, user.id);
      await axios.post('/api/listings', {
        methodSelected: 'changeListingStatus',
        sentParams: {
          listingId: listingId,
          newStatus: newStatus,
          userId: user.id
        }
      });
      
      // Actualizar el estado local usando un callback para asegurar el estado más reciente
      setListings(prevListings => {
        const updatedListings = { ...prevListings };
        
        // Encontrar el anuncio y su estado actual
        let currentStatus: ListingStatus | undefined;
        let targetListing: CarListing | undefined;
        
        Object.entries(updatedListings).forEach(([status, statusListings]) => {
          const found = statusListings.find((listing) => listing.id === listingId);
          if (found) {
            currentStatus = status as ListingStatus;
            targetListing = found;
          }
        });
        
        if (currentStatus && targetListing) {
          // Eliminar el anuncio de su estado actual
          updatedListings[currentStatus] = updatedListings[currentStatus].filter(
            (listing) => listing.id !== listingId,
          );
          
          // Añadir el anuncio al nuevo estado
          const updatedListing = { 
            ...targetListing, 
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
          
          // Añadir al nuevo estado
          updatedListings[newStatus] = [...updatedListings[newStatus], updatedListing];
        }
        
        return updatedListings;
      });
      
      toast.success(`El anuncio ha sido ${statusName} correctamente`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      toast.error('No se pudo cambiar el estado del anuncio. Por favor, intenta de nuevo.');
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle destacado
  const handleToggleFeatured = async (listingId: string) => {
    if (!user) return;
    
    try {
      setActionLoading(listingId);
      
      // Encontramos el anuncio y su estado actual usando un enfoque que no depende del estado
      let targetListing: CarListing | undefined;
      let listingStatus: ListingStatus | undefined;
      let isFeatured = false;
      
      // Usar callback para garantizar el estado más reciente
      const findListing = (prevListings: Record<ListingStatus, CarListing[]>) => {
        Object.entries(prevListings).forEach(([status, statusListings]) => {
          const found = statusListings.find((listing) => listing.id === listingId);
          if (found) {
            targetListing = found;
            listingStatus = status as ListingStatus;
            isFeatured = found.isFeatured;
          }
        });
      };
      
      // Ejecutar la búsqueda
      setListings(prevListings => {
        findListing(prevListings);
        return prevListings;
      });
      
      if (!targetListing || !listingStatus) {
        toast.error('No se encontró el anuncio para destacar');
        setActionLoading(null);
        return;
      }
      
      const newFeaturedStatus = !isFeatured;
      
      // Mostrar indicador de carga
      toast.info(newFeaturedStatus ? 'Destacando anuncio...' : 'Quitando destacado...');
      
      // Llamar al servicio para cambiar el estado destacado
      //await ListingService.toggleFeatured(listingId, newFeaturedStatus, user.id);
      await axios.post('/api/listings', {
        methodSelected: 'toggleFeatured',
        sentParams: {
          listingId: listingId,
          newFeaturedStatus: newFeaturedStatus,
          userId: user.id
        }
      });
      
      // Actualizar el estado local
      setListings(prevListings => {
        const updatedListings = { ...prevListings };
        if (listingStatus) {
          updatedListings[listingStatus] = updatedListings[listingStatus].map((listing) =>
            listing.id === listingId ? { ...listing, isFeatured: newFeaturedStatus } : listing,
          );
        }
        return updatedListings;
      });
      
      toast.success(newFeaturedStatus ? 'Anuncio destacado' : 'Destacado eliminado');
    } catch (error) {
      console.error('Error cambiando estado destacado:', error);
      toast.error('No se pudo cambiar el estado destacado del anuncio. Por favor, intenta de nuevo.');
    } finally {
      setActionLoading(null);
    }
  };

  // Renovar un anuncio expirado (reactivarlo)
  const handleRenewListing = async (listingId: string) => {
    try {
      setActionLoading(listingId);
      // Mostrar indicador de carga
      toast.info('Renovando anuncio...');
      
      // Este es esencialmente un cambio de estado de 'expired' a 'active'
      await handleStatusChange(listingId, 'active');
      
      // Mensaje específico para renovación
      toast.success('Tu anuncio ha sido renovado por 30 días adicionales');
    } catch (error) {
      console.error('Error renovando anuncio:', error);
      toast.error('No se pudo renovar el anuncio. Por favor, intenta de nuevo.');
    } finally {
      setActionLoading(null);
    }
  };

  // Ver un anuncio
  const handleViewListing = (listingId: string) => {
    router.push(`/cars/${listingId}`);
  };

  // Editar un anuncio
  const handleEditListing = (listingId: string) => {
    router.push(`/sell/list?edit=${listingId}`);
  };

  // Si está cargando la autenticación o los datos, mostrar spinner
  if (authLoading || loading) {
    return (
      <div className="container py-10 flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p>{t('common.loading')}</p>
        <p>authLoading: {authLoading.toString()}</p>
        <p>loading: {loading.toString()}</p>
      </div>
    );
  }

  // Si hay un error de carga, mostrar mensaje
  if (loadError) {
    return (
      <div className="container py-10 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-destructive text-center mb-4">
          <p className="text-lg font-bold">Error al cargar los anuncios</p>
          <p>{loadError}</p>
        </div>
        <Button onClick={() => {
          hasLoadedRef.current = false;
          loadUserListings();
        }}>
          Intentar nuevamente
        </Button>
      </div>
    );
  }

  // Si no está autenticado, mostrar mensaje y botón de login
  if (!isAuthenticated) {
    return (
      <div className="container py-10">
        <div className="max-w-md mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-4">{t('sell.myListings.pageTitle')}</h1>
          <p className="mb-8">Para ver tus anuncios, primero debes iniciar sesión en tu cuenta.</p>
          <Button asChild>
            <Link href="/sign-in">Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Componente para mostrar estado vacío
  const EmptyState = () => (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{t('sell.myListings.empty.title')}</h3>
        <p className="text-muted-foreground mb-6">{t('sell.myListings.empty.description')}</p>
        <Button asChild>
          <Link href="/sell/list">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('sell.myListings.empty.actionButton')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  // Obtener la insignia según el estado
  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">{t('sell.myListings.status.active')}</Badge>;
      case 'approved':
        return <Badge variant="default">{t('sell.myListings.status.approved')}</Badge>;
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            {t('sell.myListings.status.pending')}
          </Badge>
        );
      case 'sold':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            {t('sell.myListings.status.sold')}
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            {t('sell.myListings.status.expired')}
          </Badge>
        );
      case 'draft':
        return <Badge variant="outline">{t('sell.myListings.status.draft')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('sell.myListings.status.rejected')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {t('sell.myListings.pageTitle')}
        </h1>
        <p className="max-w-[800px] text-muted-foreground md:text-xl">
          {t('sell.myListings.pageSubtitle')}
        </p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div></div>
        <Button asChild>
          <Link href="/sell/list">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('sell.myListings.empty.actionButton')}
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="approved">
        <TabsList className="mb-6">
          <TabsTrigger value="approved">
            {t('sell.myListings.tabs.approved')} ({listings.approved.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            {t('sell.myListings.tabs.pending')} ({listings.pending.length})
          </TabsTrigger>
          <TabsTrigger value="sold">
            {t('sell.myListings.tabs.sold')} ({listings.sold.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            {t('sell.myListings.tabs.expired')} ({listings.expired.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            {t('sell.myListings.tabs.draft')} ({listings.draft.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            {t('sell.myListings.tabs.rejected')} ({listings.rejected.length})
          </TabsTrigger>
        </TabsList>

        {Object.keys(listings).map((status) => {
          const statusKey = status as keyof typeof listings;
          const statusListings = listings[statusKey];

          return (
            <TabsContent key={status} value={status} className="w-full">
              {statusListings.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('sell.myListings.table.vehicle')}</TableHead>
                        <TableHead>{t('sell.myListings.table.price')}</TableHead>
                        <TableHead>{t('sell.myListings.table.status')}</TableHead>
                        <TableHead className="text-center">
                          {t('sell.myListings.table.views')}
                        </TableHead>
                        <TableHead className="text-center">
                          {t('sell.myListings.table.contacts')}
                        </TableHead>
                        <TableHead>{t('sell.myListings.table.publishDate')}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statusListings.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <div className="relative h-10 w-16 overflow-hidden rounded">
                                {listing.images.length > 0 && (
                                  <Image
                                    src={listing.images[0]}
                                    alt={listing.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover"
                                  />
                                )}
                                {listing.images.length === 0 && (
                                  <div className="relative h-10 w-16 overflow-hidden rounded">
                                    <FaCarSide className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{listing.title}</p>
                                <p className="text-xs text-muted-foreground">{listing.location}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{formatCurrency(listing.price)}</p>
                              {listing.isFeatured && (
                                <Badge variant="secondary" className="ml-1">
                                  <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                  Destacado
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(listing.status)}</TableCell>
                          <TableCell className="text-center">{listing.viewCount}</TableCell>
                          <TableCell className="text-center">{listing.contactCount}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatRelativeDate(listing.createdAt)}
                              {listing.status === 'active' && (
                                <p className="text-xs text-muted-foreground">
                                  Expira: {formatRelativeDate(listing.expiresAt)}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleViewListing(listing.id)}
                                  disabled={actionLoading === listing.id}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>{t('sell.myListings.actions.view')}</span>
                                </DropdownMenuItem>

                                {/* Editar solo disponible para activos, pendientes y borradores */}
                                {['active', 'pending', 'draft', 'approved'].includes(
                                  listing.status,
                                ) && (
                                  <DropdownMenuItem
                                    onClick={() => handleEditListing(listing.id)}
                                    disabled={actionLoading === listing.id}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>{t('sell.myListings.actions.edit')}</span>
                                  </DropdownMenuItem>
                                )}

                                {/* Marcar como vendido solo para activos */}
                                {listing.status === 'active' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(listing.id, 'sold')}
                                    disabled={actionLoading === listing.id}
                                  >
                                    {actionLoading === listing.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Procesando...</span>
                                      </>
                                    ) : (
                                      <>
                                        <ShieldAlert className="mr-2 h-4 w-4" />
                                        <span>{t('sell.myListings.actions.markAsSold')}</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}

                                {/* Destacar/no destacar solo para activos */}
                                {listing.status === 'active' && (
                                  <DropdownMenuItem
                                    onClick={() => handleToggleFeatured(listing.id)}
                                    disabled={actionLoading === listing.id}
                                  >
                                    {actionLoading === listing.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Procesando...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Star className="mr-2 h-4 w-4" />
                                        <span>
                                          {listing.isFeatured
                                            ? 'Quitar destacado'
                                            : t('sell.myListings.actions.feature')}
                                        </span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}

                                {/* Pausar disponible para activos */}
                                {listing.status === 'active' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(listing.id, 'draft')}
                                    disabled={actionLoading === listing.id}
                                  >
                                    {actionLoading === listing.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Procesando...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="mr-2 h-4 w-4" />
                                        <span>{t('sell.myListings.actions.pause')}</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}

                                {/* Activar disponible para borradores */}
                                {listing.status === 'draft' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(listing.id, 'active')}
                                    disabled={actionLoading === listing.id}
                                  >
                                    {actionLoading === listing.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Procesando...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="mr-2 h-4 w-4" />
                                        <span>{t('sell.myListings.actions.activate')}</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}

                                {/* Renovar disponible para expirados */}
                                {listing.status === 'expired' && (
                                  <DropdownMenuItem
                                    onClick={() => handleRenewListing(listing.id)}
                                    disabled={actionLoading === listing.id}
                                  >
                                    {actionLoading === listing.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Procesando...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="mr-2 h-4 w-4" />
                                        <span>{t('sell.myListings.actions.renew')}</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}

                                {/* Eliminar disponible para todos */}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedListingId(listing.id);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  disabled={actionLoading === listing.id}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  <span>{t('sell.myListings.actions.delete')}</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={(isOpen) => {
          if (!isDeleting) {
            setDeleteConfirmOpen(isOpen);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sell.myListings.deleteConfirm.title')}</DialogTitle>
            <DialogDescription>
              {t('sell.myListings.deleteConfirm.description')}
              {selectedListingId && (
                <p className="mt-2 font-medium">
                  {
                    Object.values(listings)
                      .flat()
                      .find((listing) => listing.id === selectedListingId)?.title
                  }
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              {t('sell.myListings.deleteConfirm.cancelButton')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteListing} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                t('sell.myListings.deleteConfirm.confirmButton')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
