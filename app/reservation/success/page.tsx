'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
//import { CatalogService } from '@/services/catalog';
//import { ReservationService } from '@/services/reservation';
import { formatCurrency } from '@/utils/format';
import { useTranslation } from '@/utils/translation-context';
import { useAuth } from '@/utils/auth-hooks';
import Image from 'next/image';
import { ReservationResponse } from '@/types/reservation';
import axios from 'axios';

// Interfaz para el objeto de datos del vehículo
interface CarDetails {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  year?: number;
  images?: string[];
}

// Interfaz para los datos de reserva
interface ReservationDetails {
  id: string;
  reservation_amount: number;
  paymentId: string;
  paymentStatus: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  listingId: string;
}

export default function ReservationSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [car, setCar] = useState<CarDetails | null>(null);
  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  
  // Obtener parámetros de la URL
  const _reservationData: ReservationResponse = {
    id: searchParams.get('payment_id') || '',
    status: 'approved',
    amount: parseFloat(searchParams.get('amount') || '0'),
    createdAt: new Date().toISOString()
  };
  
  
  const listingId = searchParams.get('listing');
  const paymentId = searchParams.get('payment_id');
  const preferenceId = searchParams.get('preference_id');
  
  // Redireccionar si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in?redirect=/cars');
    }
  }, [isAuthenticated, authLoading, router]);
  
  useEffect(() => {
    const loadData = async () => {
      if (!listingId || !user || !isAuthenticated) return;
      setLoading(true);
      
      try {
        // Cargar detalles del vehículo
        //const carData = await CatalogService.getListingById(listingId);
        const response = await axios.post('/api/catalog', {
          methodSelected: 'getListingById',
          sentParams: {
            listingId: listingId
          }
        });
        const carData = response.data;
        setCar(carData);
        
        // Actualizar la reserva con el pago realizado
        if (carData) {
          //const reservationData = await ReservationService.getActiveReservationForListing(listingId);
          const response = await axios.post('/api/reservations/check', {
            methodSelected: 'updateReservationPaymentStatus',
            sentParams: {
              paymentId: paymentId,
              preferenceId: preferenceId
            }
          });
          const reservationData = response.data.reservation;
          //console.warn("reservationData: ", reservationData);
          //console.warn("user.id: ", user.id);
          //console.warn("reservationData.userId: ", reservationData.userId);
          if (reservationData && reservationData.user_id === user.id) {
            setReservation(reservationData);
          } else {
            setError('No se encontró una reserva activa para este vehículo');
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al cargar los datos del vehículo');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && user) {
      loadData();
    }
  }, [listingId, isAuthenticated, user]);
  
  // Si está cargando, mostrar spinner
  if (authLoading || loading) {
    return (
      <div className="container py-20">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }
  
  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">{t('reservation.error_title')}</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => router.push('/cars')}
            >
              {t('common.back_to_cars')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Si no hay datos del auto, mostrar mensaje
  if (!car) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">{t('reservation.no_data')}</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => router.push('/cars')}
            >
              {t('common.back_to_cars')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-20">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <CardTitle className="text-center">{t('reservation.success_title')}</CardTitle>
            <CardDescription className="text-center">
              {t('reservation.success_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {car.images && car.images.length > 0 && (
                <div className="relative h-48 w-full overflow-hidden rounded-md mb-4">
                  <Image
                    src={car.images[0]}
                    alt={car.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              )}
              
              <h3 className="text-lg font-semibold">{car.title}</h3>
              <p className="text-2xl font-bold text-primary">{formatCurrency(car.price)}</p>
              
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm font-medium mb-1">
                  {t('reservation.amount')}
                </p>
                <p className="text-lg">
                  {reservation && formatCurrency(reservation.reservation_amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('reservation.expires_in_48')}
                </p>
              </div>
              
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">{t('cars.brand')}:</span> {car.brand}
                </p>
                <p>
                  <span className="font-medium">{t('cars.model')}:</span> {car.model}
                </p>
                <p>
                  <span className="font-medium">{t('cars.year')}:</span> {car.year}
                </p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                <p className="font-medium">{t('reservation.next_steps_title')}</p>
                <p className="mt-1">{t('reservation.next_steps_description')}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              className="w-full" 
              onClick={() => router.push(`/cars/${listingId}`)}
            >
              {t('reservation.view_car_details')}
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => router.push('/user/reservations')}
            >
              {t('reservation.view_reservations')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 