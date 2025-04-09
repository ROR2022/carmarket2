'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  AdminListingsFilter, 
  PaginatedListings 
} from '@/services/admin';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { CarListing, ListingStatus } from '@/types/listing';
import { formatCurrency } from '@/utils/format';
import axios from 'axios';

// Función auxiliar para formatear precio
const formatPrice = (price: number) => formatCurrency(price);

// Colores según el estado
const statusColors: Record<ListingStatus, string> = {
  'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'changes_requested': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  'sold': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'expired': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  'reserved': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export default function AdminListingsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') as ListingStatus | null;
  
  const [filters, setFilters] = useState<AdminListingsFilter>({
    status: initialStatus || undefined,
    limit: 10,
    offset: 0
  });
  
  const [listings, setListings] = useState<PaginatedListings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedListing, setSelectedListing] = useState<CarListing | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | 'changes' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Cargar anuncios
  useEffect(() => {
    async function loadListings() {
      try {
        setLoading(true);
        //const data = await AdminService.getListingsForReview(filters);
        const { data } = await axios.post('/api/admin', {
          methodSelected: 'getListingsForReview',
          sentParams: { filters }
        });
        console.log('data getListingsForReview: ', data.listings);
        setListings(data.listings);
        setError(null);
      } catch (err) {
        console.error('Error loading listings:', err);
        setError('Error al cargar los anuncios.');
      } finally {
        setLoading(false);
      }
    }
    
    loadListings();
  }, [filters]);
  
  // Manejar cambio de estado
  const handleStatusChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      status: value === 'all' ? undefined : value as ListingStatus,
      offset: 0 // Reset pagination
    }));
  };
  
  // Manejar búsqueda
  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      searchTerm,
      offset: 0 // Reset pagination
    }));
  };
  
  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      offset: (page - 1) * (prev.limit || 10)
    }));
  };
  
  // Ver detalle de anuncio
  const handleViewListing = (listing: CarListing) => {
    setSelectedListing(listing);
    setViewDialog(true);
  };
  
  // Iniciar acción de moderación
  const handleStartAction = (action: 'approve' | 'reject' | 'changes', listing: CarListing) => {
    setSelectedListing(listing);
    setActionDialog(action);
    setActionNotes('');
  };
  
  // Ejecutar acción de moderación
  const handleExecuteAction = async () => {
    if (!selectedListing || !actionDialog) return;
    
    try {
      setActionLoading(true);
      
      switch (actionDialog) {
        case 'approve':
          //await AdminService.approveListing(selectedListing.id, actionNotes);
          await axios.post('/api/admin', {
            methodSelected: 'approveListing',
            sentParams: { listingId: selectedListing.id, notes: actionNotes }
          });

          break;
          
        case 'reject':
          //await AdminService.rejectListing(selectedListing.id, actionNotes);
          await axios.post('/api/admin', {
            methodSelected: 'rejectListing',
            sentParams: { listingId: selectedListing.id, notes: actionNotes }
            });
          break;
          
        case 'changes':
          //await AdminService.requestChanges(selectedListing.id, actionNotes);
          await axios.post('/api/admin', {
            methodSelected: 'requestChanges',
            sentParams: { listingId: selectedListing.id, notes: actionNotes }
          });
          break;
      }
      
      // Actualizar la lista de anuncios
      //const updatedData = await AdminService.getListingsForReview(filters);
      const response = await axios.post('/api/admin', {
        methodSelected: 'getListingsForReview',
        sentParams: { filters }
      });
      const updatedData = response.data.listings;
      setListings(updatedData);
      
      // Cerrar el diálogo
      setActionDialog(null);
      setSelectedListing(null);
      
    } catch (err) {
      console.error('Error executing action:', err);
      alert('Error al ejecutar la acción. Por favor, inténtalo de nuevo.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Renderizar estado del anuncio
  const renderStatus = (status: ListingStatus) => {
    return (
      <Badge className={statusColors[status]}>
        {status === 'pending' && 'Pendiente'}
        {status === 'approved' && 'Aprobado'}
        {status === 'active' && 'Activo'}
        {status === 'rejected' && 'Rechazado'}
        {status === 'changes_requested' && 'Cambios solicitados'}
        {status === 'draft' && 'Borrador'}
        {status === 'sold' && 'Vendido'}
        {status === 'expired' && 'Expirado'}
      </Badge>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Anuncios</h1>
          <p className="text-muted-foreground mt-2">
            Revisa y modera los anuncios del marketplace.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select 
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="approved">Aprobados</SelectItem>
              <SelectItem value="rejected">Rechazados</SelectItem>
              <SelectItem value="changes_requested">Cambios solicitados</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Input
              placeholder="Buscar anuncios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-[200px]"
            />
            <Button onClick={handleSearch}>Buscar</Button>
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Anuncios</CardTitle>
          <CardDescription>
            {filters.status 
              ? `Mostrando anuncios ${filters.status === 'pending' 
                ? 'pendientes' 
                : filters.status === 'approved' 
                  ? 'aprobados' 
                  : filters.status === 'rejected' 
                    ? 'rechazados' 
                    : filters.status === 'changes_requested' 
                      ? 'con cambios solicitados' 
                      : 'en borrador'}`
              : 'Mostrando todos los anuncios'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : listings && listings.listings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.listings.map(listing => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {listing.images && listing.images.length > 0 ? (
                          <div className="relative h-10 w-16 overflow-hidden rounded">
                            <Image
                              src={listing.images[0]}
                              alt={listing.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                            Sin img
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{listing.title}</p>
                          <p className="text-xs text-muted-foreground">{listing.sellerName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{formatPrice(listing.price)}</p>
                    </TableCell>
                    <TableCell>
                      {renderStatus(listing.status)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{new Date(listing.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(listing.createdAt).toLocaleTimeString()}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewListing(listing)}
                        >
                          Ver
                        </Button>
                        
                        {listing.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleStartAction('approve', listing)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleStartAction('reject', listing)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron anuncios que coincidan con los criterios de búsqueda.
            </div>
          )}
        </CardContent>
        {listings && listings.totalPages > 1 && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {(filters.offset || 0) + 1}-
              {Math.min((filters.offset || 0) + (filters.limit || 10), listings.total)} de {listings.total}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => listings.page > 1 && handlePageChange(listings.page - 1)}
                    className={listings.page <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {Array.from({ length: listings.totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Mostrar siempre primera, última y las páginas cercanas a la actual
                    return (
                      page === 1 ||
                      page === listings.totalPages ||
                      Math.abs(page - listings.page) <= 1
                    );
                  })
                  .map((page, i, arr) => {
                    // Agregar puntos suspensivos si hay saltos en la secuencia
                    const prevPage = arr[i - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;
                    
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <PaginationItem>
                            <span className="px-4 py-2">...</span>
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <Button
                            variant={page === listings.page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        </PaginationItem>
                      </React.Fragment>
                    );
                  })}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => listings.page < listings.totalPages && handlePageChange(listings.page + 1)}
                    className={listings.page >= listings.totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>
      
      {/* Diálogo para ver detalles del anuncio */}
      {selectedListing && (
        <Dialog open={viewDialog} onOpenChange={setViewDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedListing.title}</DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-2 mt-1">
                  {renderStatus(selectedListing.status)}
                  <span className="text-sm text-muted-foreground">
                    Creado el {new Date(selectedListing.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                {selectedListing.images && selectedListing.images.length > 0 ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video overflow-hidden rounded-lg">
                      <Image
                        src={selectedListing.images[0]}
                        alt={selectedListing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {selectedListing.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {selectedListing.images.slice(1, 5).map((img, i) => (
                          <div key={i} className="relative aspect-square overflow-hidden rounded">
                            <Image
                              src={img}
                              alt={`${selectedListing.title} - ${i + 2}`}
                              fill
                              className="object-cover"
                              sizes="100px"
                            />
                          </div>
                        ))}
                        {selectedListing.images.length > 5 && (
                          <div className="text-sm text-muted-foreground mt-1">
                            +{selectedListing.images.length - 5} imágenes más
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Sin imágenes</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{formatPrice(selectedListing.price)}</h3>
                  <p className="text-sm text-muted-foreground">{selectedListing.location}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="font-medium">Marca:</p>
                    <p>{selectedListing.brand}</p>
                  </div>
                  <div>
                    <p className="font-medium">Modelo:</p>
                    <p>{selectedListing.model}</p>
                  </div>
                  <div>
                    <p className="font-medium">Año:</p>
                    <p>{selectedListing.year}</p>
                  </div>
                  <div>
                    <p className="font-medium">Kilometraje:</p>
                    <p>{selectedListing.mileage.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="font-medium">Transmisión:</p>
                    <p>{selectedListing.transmission}</p>
                  </div>
                  <div>
                    <p className="font-medium">Combustible:</p>
                    <p>{selectedListing.fuelType}</p>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium text-sm">Descripción:</p>
                  <p className="text-sm mt-1">{selectedListing.description}</p>
                </div>
                
                <div>
                  <p className="font-medium text-sm">Características:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedListing.features.map((feature, i) => (
                      <Badge key={i} variant="outline">{feature}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="font-medium text-sm">Vendedor:</p>
                  <p className="text-sm">{selectedListing.sellerName}</p>
                  <p className="text-sm">{selectedListing.sellerEmail}</p>
                  {selectedListing.sellerPhone && (
                    <p className="text-sm">{selectedListing.sellerPhone}</p>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setViewDialog(false)}>
                Cerrar
              </Button>
              
              {selectedListing.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setViewDialog(false);
                      handleStartAction('approve', selectedListing);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprobar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setViewDialog(false);
                      handleStartAction('reject', selectedListing);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Diálogo para aprobar/rechazar/solicitar cambios */}
      {actionDialog && selectedListing && (
        <Dialog open={true} onOpenChange={() => setActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog === 'approve' && 'Aprobar anuncio'}
                {actionDialog === 'reject' && 'Rechazar anuncio'}
                {actionDialog === 'changes' && 'Solicitar cambios'}
              </DialogTitle>
              <DialogDescription>
                {actionDialog === 'approve' && 'Este anuncio será publicado y visible para todos los usuarios.'}
                {actionDialog === 'reject' && 'Este anuncio será rechazado y no se publicará.'}
                {actionDialog === 'changes' && 'Se solicitarán cambios al vendedor antes de publicar.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                {selectedListing.images && selectedListing.images.length > 0 ? (
                  <div className="relative h-12 w-20 overflow-hidden rounded">
                    <Image
                      src={selectedListing.images[0]}
                      alt={selectedListing.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-20 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                    Sin imagen
                  </div>
                )}
                <div>
                  <p className="font-medium">{selectedListing.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedListing.sellerName}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">
                  {actionDialog === 'approve' 
                    ? 'Notas (opcional)' 
                    : 'Motivo'}
                </label>
                <Textarea
                  placeholder={
                    actionDialog === 'approve'
                      ? 'Opcionalmente, añade notas para el vendedor'
                      : actionDialog === 'reject'
                        ? 'Explica por qué se rechaza este anuncio'
                        : 'Explica qué cambios debe realizar el vendedor'
                  }
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="mt-1"
                  rows={4}
                  required={actionDialog !== 'approve'}
                />
                {actionDialog !== 'approve' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta información se enviará al vendedor.
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActionDialog(null)}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleExecuteAction}
                disabled={actionLoading || (actionDialog !== 'approve' && !actionNotes.trim())}
                className={
                  actionDialog === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : actionDialog === 'reject'
                      ? 'bg-destructive hover:bg-destructive/90'
                      : ''
                }
              >
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {actionDialog === 'approve' && 'Aprobar'}
                {actionDialog === 'reject' && 'Rechazar'}
                {actionDialog === 'changes' && 'Solicitar cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 