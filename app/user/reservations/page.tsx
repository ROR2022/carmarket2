'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/utils/format';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Calendar, Car, Check, Clock, MessageSquare, ShieldAlert, Info } from 'lucide-react';
import { useAuth } from '@/utils/auth-hooks';
import { useTranslation } from '@/utils/translation-context';
//import { ReservationService } from '@/services/reservation';
import { Badge } from '@/components/ui/badge';
import { ReservationWithCar } from '@/types/reservation';
import axios from 'axios';
import { ContactMessageData } from '@/components/car/contact-seller-dialog';
import { ContactSellerDialog } from '@/components/car/contact-seller-dialog';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { DbListing } from '@/services/listings';
import { Car as CarType } from '@/types/car';
export default function UserReservationsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  const [reservations, setReservations] = useState<ReservationWithCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Redireccionar si el usuario no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in?redirect=/user/reservations');
    }
  }, [isAuthenticated, authLoading, router]);

  const loadReservations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      //const data = await ReservationService.getUserReservationsWithCarDetails(user.id);
      const response = await axios.post('/api/reservations/check', {
        methodSelected: 'getUserReservationsWithCarDetails',
        sentParams: {
          userId: user.id
        }
      });
      const { data } = response;
      setReservations(data || []);
    } catch (err) {
      console.error('Error loading reservations:', err);
      setError('No se pudieron cargar tus reservas. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar las reservas del usuario
  useEffect(() => {
    

    if (isAuthenticated && user) {
      loadReservations();
    }
  }, [isAuthenticated, user]);

  // Filtrar reservas por estado
  const activeReservations = reservations.filter(r => r.paymentStatus === 'approved' && new Date(r.expiresAt) > new Date());
  const pendingReservations = reservations.filter(r => r.paymentStatus === 'pending');
  const pastReservations = reservations.filter(r => r.paymentStatus === 'approved' && new Date(r.expiresAt) <= new Date() || r.paymentStatus === 'expired');

  // Mostrar pantalla de carga
  if (authLoading || loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de error
  if (error) {
    return (
      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">{t('user.reservations.title')}</h1>
          <Card>
            <CardContent className="py-10">
              <div className="flex flex-col items-center text-center">
                <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold mb-2">{t('common.error')}</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  {t('common.retry')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay reservas
  if (reservations.length === 0) {
    return (
      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">{t('user.reservations.title')}</h1>
          <Card>
            <CardContent className="py-10">
              <div className="flex flex-col items-center text-center">
                <Info className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">{t('user.reservations.no_reservations')}</h2>
                <p className="text-muted-foreground mb-6">{t('user.reservations.no_reservations_description')}</p>
                <Button asChild>
                  <Link href="/cars">{t('user.reservations.browse_cars')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Renderizar lista de reservas
  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t('user.reservations.title')}</h1>
        
        <Tabs defaultValue="active">
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              {t('user.reservations.active')}
              {activeReservations.length > 0 && (
                <Badge variant="secondary" className="ml-2">{activeReservations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              {t('user.reservations.pending')}
              {pendingReservations.length > 0 && (
                <Badge variant="secondary" className="ml-2">{pendingReservations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">
              {t('user.reservations.past')}
              {pastReservations.length > 0 && (
                <Badge variant="secondary" className="ml-2">{pastReservations.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            {activeReservations.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>{t('user.reservations.no_active_reservations')}</p>
              </div>
            ) : (
              activeReservations.map(reservation => (
                <ReservationCard 
                  key={reservation.id} 
                  reservation={reservation} 
                  type="active" 
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-4">
            {pendingReservations.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>{t('user.reservations.no_pending_reservations')}</p>
              </div>
            ) : (
              pendingReservations.map(reservation => (
                <ReservationCard 
                  key={reservation.id} 
                  reservation={reservation} 
                  type="pending" 
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4">
            {pastReservations.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>{t('user.reservations.no_past_reservations')}</p>
              </div>
            ) : (
              pastReservations.map(reservation => (
                <ReservationCard 
                  key={reservation.id} 
                  reservation={reservation} 
                  type="past" 
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Componente para mostrar una tarjeta de reserva
function ReservationCard({ 
  reservation,
  type
}: { 
  reservation: ReservationWithCar;
  type: 'active' | 'pending' | 'past';
}) {
  const { t } = useTranslation();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [car, setCar] = useState<DbListing | null>(null);
  // Fecha de expiración y tiempo restante
  const expiryDate = new Date(reservation.expiresAt);
  const now = new Date();
  
  const timeUntilExpiry = formatDistance(expiryDate, now, {
    addSuffix: true,
    locale: es
  });

  // URL de la imagen
  const imageUrl = reservation.carImage || '/placeholder-car.jpg';


  const getDataCar = async() => {
    try {
      const supabase = createClient();
    const { data: carTmp, error: carError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', reservation.listingId)
      .single();

    if (carError) {
      console.error('Error al obtener el vehículo:', carError);
      toast.error('Error al obtener el vehículo');
      return;
      }
      setCar(carTmp);
    } catch (error) {
      console.error('Error al obtener el vehículo:', error);
      toast.error('Error al obtener el vehículo');
    }
  }

  useEffect(() => {
    getDataCar();
  }, []);


  const handleSendMessage = async(message?: ContactMessageData) => {
    setIsContactOpen(false);
    //console.log(message);
    if (!car) {
      toast.error('Error al obtener el vehículo');
      return;
    }
    
    try {
      
      const response = await axios.post('/api/messages', {
        methodSelected: 'sendContactMessage',
        sentParams: {
          listingId: reservation.listingId,
          sellerId: car?.seller_id,
          message: message
        }
      });
      console.log(response.data);
      toast.success('Mensaje enviado correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar el mensaje');
    }
  };

  if (!car) {
    return null;
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Imagen del vehículo */}
          <div className="relative h-48 md:h-auto md:w-1/3 overflow-hidden">
            <Link href={`/cars/${reservation.listingId}`}>
              <div className="relative h-full w-full">
                <Image
                  src={imageUrl}
                  alt={reservation.carTitle || 'Car image'}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </Link>
          </div>
          
          {/* Detalles de la reserva */}
          <div className="p-4 md:p-6 flex-1">
            <div className="flex flex-col h-full">
              <div className="mb-2">
                {type === 'active' && (
                  <Badge className="mb-2 bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                    <Check className="mr-1 h-3 w-3" />
                    {t('user.reservations.status.active')}
                  </Badge>
                )}
                
                {type === 'pending' && (
                  <Badge className="mb-2 bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
                    <Clock className="mr-1 h-3 w-3" />
                    {t('user.reservations.status.pending')}
                  </Badge>
                )}
                
                {type === 'past' && (
                  <Badge className="mb-2 bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200">
                    <Calendar className="mr-1 h-3 w-3" />
                    {t('user.reservations.status.expired')}
                  </Badge>
                )}
                
                <Link href={`/cars/${reservation.listingId}`} className="hover:underline">
                  <h2 className="text-xl font-semibold">{reservation.carTitle || `${reservation.carBrand} ${reservation.carModel} ${reservation.carYear}`}</h2>
                </Link>
                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                  <span>{reservation.carBrand}</span>
                  <span>•</span>
                  <span>{reservation.carModel}</span>
                  <span>•</span>
                  <span>{reservation.carYear}</span>
                </div>
              </div>
              
              <div className="space-y-2 flex-1">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('user.reservations.price')}:</p>
                    <p className="font-medium">{formatCurrency(reservation.carPrice || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('user.reservations.deposit')}:</p>
                    <p className="font-medium">{formatCurrency(reservation.reservationAmount)}</p>
                  </div>
                </div>
                
                {type !== 'past' && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('user.reservations.expires')}:</p>
                    <p className="font-medium">
                      {formatDate(reservation.expiresAt)} ({timeUntilExpiry})
                    </p>
                  </div>
                )}
                
                {type === 'past' && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('user.reservations.expired')}:</p>
                    <p className="font-medium">{formatDate(reservation.expiresAt)}</p>
                  </div>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex flex-wrap justify-between gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/cars/${reservation.listingId}`}>
                    <Car className="mr-1 h-4 w-4" />
                    {t('user.reservations.view_details')}
                  </Link>
                </Button>
                
                {type === 'active' && (
                  <Button size="sm" onClick={() => setIsContactOpen(true)}>
                    <MessageSquare className="mr-1 h-4 w-4" />
                    {t('user.reservations.contact_seller')}
                  </Button>
                )}

                <ContactSellerDialog 
                  car={car as unknown as CarType} 
                  isOpen={isContactOpen} 
                  onOpenChange={setIsContactOpen}
                  onSendMessage={async (message: ContactMessageData) => {
                    await handleSendMessage(message);
                  }}
                />
                
                {type === 'pending' && (
                  <Button size="sm">
                    <Clock className="mr-1 h-4 w-4" />
                    {t('user.reservations.check_payment')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 