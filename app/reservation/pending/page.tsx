'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Loader2 } from 'lucide-react';
//import { CatalogService } from '@/services/catalog';
import axios from 'axios';
import { formatCurrency } from '@/utils/format';
import { useTranslation } from '@/utils/translation-context';
import { useAuth } from '@/utils/auth-hooks';
import { ReservationResponse } from '@/types/reservation';

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

export default function ReservationPendingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [car, setCar] = useState<CarDetails | null>(null);
  
  const listingId = searchParams.get('listing');
  const paymentData: ReservationResponse = {
    id: searchParams.get('payment_id') || '',
    status: 'pending',
    amount: parseFloat(searchParams.get('amount') || '0'),
    createdAt: new Date().toISOString()
  };
  
  // Redireccionar si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in?redirect=/cars');
    }
  }, [isAuthenticated, authLoading, router]);
  
  // Cargar detalles del vehículo
  useEffect(() => {
    const loadCar = async () => {
      if (!listingId) return;
      setLoading(true);
      
      try {
        //const carData = await CatalogService.getListingById(listingId);
        const response = await axios.post('/api/catalog', {
          methodSelected: 'getListingById',
          sentParams: {
            listingId: listingId
          }
        });
        setCar(response.data);
      } catch (err) {
        console.error('Error loading car details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadCar();
  }, [listingId]);
  
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
  
  return (
    <div className="container py-20">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-12 h-12 text-amber-500" />
            </div>
            <CardTitle className="text-center">{t('reservation.payment_pending')}</CardTitle>
            <CardDescription className="text-center">
              {t('reservation.payment_pending_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {car && (
                <>
                  <h3 className="text-lg font-semibold">{car.title}</h3>
                  <p className="text-xl font-bold">{formatCurrency(car.price)}</p>
                </>
              )}
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                <p className="font-medium">{t('reservation.pending_notice_title')}</p>
                <p className="mt-1">{t('reservation.pending_notice_description')}</p>
              </div>
              
              <div className="space-y-1 text-sm">
                <p>{t('reservation.payment_id')}: {paymentData.id || t('common.not_available')}</p>
              </div>
              
              <div className="bg-muted p-4 rounded-md text-sm">
                <p className="font-medium">{t('reservation.next_steps')}</p>
                <ol className="mt-2 space-y-1 list-decimal list-inside">
                  <li>{t('reservation.next_step_1')}</li>
                  <li>{t('reservation.next_step_2')}</li>
                  <li>{t('reservation.next_step_3')}</li>
                </ol>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              className="w-full" 
              onClick={() => router.push('/user/reservations')}
            >
              {t('reservation.view_reservations')}
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => router.push('/cars')}
            >
              {t('common.back_to_cars')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 