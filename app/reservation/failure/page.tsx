'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card as _Card, CardContent as _CardContent, CardDescription as _CardDescription, 
  CardFooter as _CardFooter, CardHeader as _CardHeader, CardTitle as _CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle as _AlertCircle, Loader2, XCircle } from 'lucide-react';
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

export default function ReservationFailurePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [car, setCar] = useState<CarDetails | null>(null);
  
  const listingId = searchParams.get('listing');
  const paymentData: ReservationResponse = {
    id: searchParams.get('payment_id') || '',
    status: 'error',
    amount: 0,
    createdAt: new Date().toISOString(),
    error: {
      message: searchParams.get('error') || t('reservation.unknown_error'),
      code: searchParams.get('status') || '400'
    }
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
  
  // Manejar el reintento de pago
  const handleRetry = () => {
    if (listingId) {
      router.push(`/cars/${listingId}`);
    } else {
      router.push('/cars');
    }
  };
  
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
    <div className="container flex flex-col items-center justify-center py-12">
      <div className="mb-8 flex flex-col items-center justify-center text-center">
        <XCircle className="mb-4 h-16 w-16 text-red-500" />
        <h1 className="mb-2 text-2xl font-bold">Reservation Failed</h1>
        <p className="text-gray-600">
          {paymentData?.error?.message || "We couldn't process your reservation at this time."}
        </p>
      </div>
      
      <div className="mb-8 max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Error Details</h2>
        {paymentData?.error ? (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="text-gray-600">Error Code:</div>
              <div>{paymentData.error.code || 'Unknown'}</div>
            </div>
            {paymentData.error.details && (
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="text-gray-600">Details:</div>
                <div>{paymentData.error.details}</div>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-600">No additional error details available.</p>
        )}
      </div>
      
      <div className="space-y-4">
        {car && (
          <>
            <h3 className="text-lg font-semibold">{car.title}</h3>
            <p className="text-xl font-bold">{formatCurrency(car.price)}</p>
          </>
        )}
        
        <div className="bg-muted p-4 rounded-md text-sm">
          <p className="font-medium">{t('reservation.retry_tips_title')}</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>{t('reservation.retry_tip_1')}</li>
            <li>{t('reservation.retry_tip_2')}</li>
            <li>{t('reservation.retry_tip_3')}</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8 space-x-2">
        <Button 
          className="w-full" 
          onClick={handleRetry}
        >
          {t('reservation.try_again')}
        </Button>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => router.push('/cars')}
        >
          {t('common.back_to_cars')}
        </Button>
      </div>
    </div>
  );
} 