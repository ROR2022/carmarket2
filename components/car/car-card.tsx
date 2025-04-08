'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/utils/translation-context';
import { Car } from '@/types/car';
import { formatCurrency } from '@/utils/format';

interface CarCardProps {
  car: Car;
  isFavorite?: boolean;
  onToggleFavorite?: (carId: string) => void;
}

export function CarCard({ car, isFavorite = false, onToggleFavorite }: CarCardProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  //console.log('dataCar:..',car);

  const handleToggleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(car.id);
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div 
        className="relative aspect-[16/9] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={`/cars/${car.id}`}>
          <div className="relative w-full h-full">
            <Image
              src={car.images[0] || '/images/placeholder-car.png'}
              alt={car.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 ease-in-out"
              style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
            />
          </div>
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/80 hover:bg-white"
              onClick={handleToggleFavorite}
            >
              <Heart 
                className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} 
              />
              <span className="sr-only">
                {isFavorite 
                  ? t('cars.carCard.removeFromFavorites') 
                  : t('cars.carCard.addToFavorites')
                }
              </span>
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-primary hover:bg-primary/90">
                {car.category.charAt(0).toUpperCase() + car.category.slice(1)}
              </Badge>
              <span className="text-white font-semibold">{car.year}</span>
            </div>
          </div>
        </Link>
      </div>
      <CardContent className="p-4">
        <Link href={`/cars/${car.id}`} className="no-underline">
          <h3 className="text-lg font-bold truncate hover:text-primary transition-colors">
            {car.title}
          </h3>
          <p className="text-2xl font-bold text-primary mt-1">
            {formatCurrency(car.price)}
          </p>
          
          <div className="mt-3 flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
                <path d="M12 2v2M12 14v2M22 12h-2M14 12h-2M8 12H6M2 12h2M7 7 5.5 5.5M17 7l1.5-1.5M17 17l1.5 1.5M7 17l-1.5 1.5" />
              </svg>
              <span>{car.mileage.toLocaleString()} km</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
                <circle cx="7" cy="5" r="2" />
                <circle cx="17" cy="5" r="2" />
                <path d="M14 13h1a3 3 0 0 1 0 6h-1v-6ZM6 13v6h1a3 3 0 0 0 0-6H6Z" />
                <rect width="18" height="14" x="3" y="3" rx="2" />
              </svg>
              <span>{car.transmission}</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
                <path d="M14 12c0 1.1-2 2-2 2s-2-.9-2-2 2-2 2-2 2 .9 2 2z" />
                <path d="M12 20s8-3 8-8-8-8-8-8-8 3-8 8 8 8 8 8z" />
                <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
                <path d="M12 20v-8" />
                <path d="M12 12H4" />
              </svg>
              <span>{car.fuelType}</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 13h6" />
                <path d="M9 17h6" />
                <path d="M9 9h6" />
              </svg>
              <span>{car.year}</span>
            </div>
          </div>
        </Link>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2 justify-between">
        <Button asChild className="w-full">
          <Link href={`/cars/${car.id}`}>
            {t('cars.carCard.viewDetails')}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 