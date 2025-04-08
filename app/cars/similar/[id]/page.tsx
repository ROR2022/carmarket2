'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/utils/translation-context';
import { Car } from '@/types/car';
import { CarCard } from '@/components/car/car-card';

// Simulamos la obtención de datos para autos similares
const fetchSimilarCars = async (id: string): Promise<{ originalCar: Car | null; similarCars: Car[] }> => {
  // Simulamos un retraso para mostrar el estado de carga
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Datos simulados para los autos (para demo)
  const MOCK_CARS: Record<string, Car> = {
    'car-1': {
      id: 'car-1',
      title: 'Toyota Corolla 2020',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      category: 'sedan',
      price: 3500000,
      mileage: 25000,
      fuelType: 'gasoline',
      transmission: 'automatic',
      features: ['Aire acondicionado', 'Vidrios eléctricos', 'Cierre centralizado'],
      description: 'Toyota Corolla 2020 en excelente estado.',
      location: 'Buenos Aires, Argentina',
      images: ['/images/cars/sedan.jpeg'],
      sellerId: 'seller-1',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    'car-2': {
      id: 'car-2',
      title: 'Honda CR-V 2019',
      brand: 'Honda',
      model: 'CR-V',
      year: 2019,
      category: 'suv',
      price: 4200000,
      mileage: 35000,
      fuelType: 'gasoline',
      transmission: 'automatic',
      features: ['Aire acondicionado', 'Vidrios eléctricos', 'Cierre centralizado'],
      description: 'Honda CR-V 2019 en perfectas condiciones.',
      location: 'Córdoba, Argentina',
      images: ['/images/cars/suv.jpeg'],
      sellerId: 'seller-2',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    'car-3': {
      id: 'car-3',
      title: 'Volkswagen Golf 2018',
      brand: 'Volkswagen',
      model: 'Golf',
      year: 2018,
      category: 'hatchback',
      price: 2800000,
      mileage: 45000,
      fuelType: 'diesel',
      transmission: 'manual',
      features: ['Aire acondicionado', 'Vidrios eléctricos', 'Cierre centralizado'],
      description: 'Volkswagen Golf 2018 diesel, excelente consumo y potencia.',
      location: 'Rosario, Argentina',
      images: ['/images/cars/hatchback.jpeg'],
      sellerId: 'seller-3',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    'car-4': {
      id: 'car-4',
      title: 'Toyota Camry 2021',
      brand: 'Toyota',
      model: 'Camry',
      year: 2021,
      category: 'sedan',
      price: 4100000,
      mileage: 15000,
      fuelType: 'hybrid',
      transmission: 'automatic',
      features: ['Aire acondicionado', 'Vidrios eléctricos', 'Cierre centralizado'],
      description: 'Toyota Camry Híbrido 2021, el sedan más vendido de su categoría.',
      location: 'Buenos Aires, Argentina',
      images: ['/images/cars/sedan.jpeg'],
      sellerId: 'seller-4',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    'car-5': {
      id: 'car-5',
      title: 'Honda Civic 2020',
      brand: 'Honda',
      model: 'Civic',
      year: 2020,
      category: 'sedan',
      price: 3200000,
      mileage: 28000,
      fuelType: 'gasoline',
      transmission: 'automatic',
      features: ['Aire acondicionado', 'Vidrios eléctricos', 'Cierre centralizado'],
      description: 'Honda Civic 2020, deportivo y económico.',
      location: 'Mendoza, Argentina',
      images: ['/images/cars/sedan.jpeg'],
      sellerId: 'seller-5',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    'car-6': {
      id: 'car-6',
      title: 'Volkswagen Polo 2019',
      brand: 'Volkswagen',
      model: 'Polo',
      year: 2019,
      category: 'hatchback',
      price: 2400000,
      mileage: 40000,
      fuelType: 'gasoline',
      transmission: 'manual',
      features: ['Aire acondicionado', 'Vidrios eléctricos', 'Cierre centralizado'],
      description: 'Volkswagen Polo 2019, compacto y ágil.',
      location: 'Córdoba, Argentina',
      images: ['/images/cars/hatchback.jpeg'],
      sellerId: 'seller-6',
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    }
  };
  
  const originalCar = MOCK_CARS[id] || null;
  
  if (!originalCar) {
    return { originalCar: null, similarCars: [] };
  }
  
  // Lógica para encontrar autos similares (misma marca o categoría, precio cercano, etc.)
  const similarCars = Object.values(MOCK_CARS).filter(car => {
    if (car.id === id) return false; // Excluimos el auto original
    
    // Criterios de similitud (al menos uno debe cumplirse):
    const sameBrand = car.brand === originalCar.brand;
    const sameCategory = car.category === originalCar.category;
    const similarPrice = Math.abs(car.price - originalCar.price) / originalCar.price < 0.3; // Diferencia de precio < 30%
    const similarYear = Math.abs(car.year - originalCar.year) <= 2; // Diferencia de año ± 2
    
    return (sameBrand || sameCategory) && (similarPrice || similarYear);
  });
  
  return { originalCar, similarCars };
};

export default function SimilarCarsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  
  const carId = params.id as string;
  
  // Estados
  const [originalCar, setOriginalCar] = useState<Car | null>(null);
  const [similarCars, setSimilarCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Cargar datos
  useEffect(() => {
    const loadCars = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { originalCar, similarCars } = await fetchSimilarCars(carId);
        
        if (originalCar) {
          setOriginalCar(originalCar);
          setSimilarCars(similarCars);
        } else {
          setError('Vehículo no encontrado');
          // Redirigir tras un breve retraso si no se encuentra el auto
          setTimeout(() => {
            router.push('/cars');
          }, 3000);
        }
      } catch (err) {
        console.error('Error fetching similar cars:', err);
        setError('Error al cargar los vehículos similares');
      } finally {
        setLoading(false);
      }
    };
    
    loadCars();
  }, [carId, router]);
  
  // Manejar toggles de favoritos
  const handleToggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };
  
  // Renderizado condicional para carga y error
  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-96">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !originalCar) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold mb-4">{t('common.error')}</h2>
          <p className="text-muted-foreground mb-6">{error || t('cars.not_found')}</p>
          <Button asChild>
            <Link href="/cars">{t('common.back_to_list')}</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Renderizado principal
  return (
    <div className="container py-10">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold md:text-3xl">
            {t('cars.similar_to')} {originalCar.brand} {originalCar.model}
          </h1>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/cars/${originalCar.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('cars.back_to_vehicle')}
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">
          {t('cars.similar_description')}
        </p>
      </div>
      
      {/* Lista de autos similares */}
      {similarCars.length === 0 ? (
        <div className="py-12 text-center">
          <h3 className="text-xl font-medium mb-4">{t('cars.no_similar_found')}</h3>
          <p className="text-muted-foreground mb-8">{t('cars.try_different')}</p>
          <Button asChild>
            <Link href="/cars">{t('common.browse_all')}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {similarCars.map(car => (
            <CarCard
              key={car.id}
              car={car}
              isFavorite={favorites.has(car.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
      
      {/* Navegación de páginas */}
      <div className="mt-10 text-center">
        <Button asChild variant="outline">
          <Link href="/cars">
            {t('common.back_to_list')}
          </Link>
        </Button>
      </div>
    </div>
  );
} 