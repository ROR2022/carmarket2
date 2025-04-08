'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
//import { CatalogService } from '@/services/catalog';
import axios from 'axios';
import CarDetail from '@/components/car/car-detail';
import { Loader2 } from 'lucide-react';
import { Car } from '@/types/car';
export default function CarPage() {
  const params = useParams();
  const _router = useRouter();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);
  
  useEffect(() => {
    const fetchCar = async () => {
      setLoading(true);
      try {
        const carId = params.id as string;
        //const carData = await CatalogService.getListingById(carId);
        const response = await axios.post('/api/catalog', {
          methodSelected: 'getListingById',
          sentParams: {
            listingId: carId
          }
        });
        setCar(response.data);
      } catch (error) {
        console.error("Error loading car:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCar();
  }, [params.id]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error || !car) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
          <h2 className="text-lg font-medium">Error</h2>
          <p>No se pudo cargar la información del vehículo. Intenta nuevamente más tarde.</p>
        </div>
      </div>
    );
  }
  
  return <CarDetail car={car} />;
}
