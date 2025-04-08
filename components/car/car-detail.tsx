'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Car } from '@/types/car';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CarCategoriesSection as CarSections } from './car-sections';
import ReserveCarButton  from './reserve-car-button';
import { ContactMessageData, ContactSellerDialog } from './contact-seller-dialog';
import ReservationStatus from './reservation-status';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import { toast } from 'sonner';
import axios from 'axios';

interface CarDetailProps {
  car: Car;
}

export default function CarDetail({ car }: CarDetailProps) {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  
  // Usar todas las imágenes o mostrar un placeholder si no hay imágenes
  const images = car.images && car.images.length > 0 
    ? car.images 
    : ['/placeholders/car-placeholder.jpg'];
  
  const handleThumbnailClick = (index: number) => {
    setCurrentImage(index);
  };
  
  const handleSendMessage = async(message?: ContactMessageData) => {
    setIsContactOpen(false);
    //console.log(message);
    try {
      const response = await axios.post('/api/messages', {
        methodSelected: 'sendContactMessage',
        sentParams: {
          listingId: car.id,
          sellerId: car.sellerId,
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

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('URL copiada al portapapeles');
    console.warn('URL copiada al portapapeles: ', url);
  };
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column with images */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Main Carousel */}
            <Carousel className="w-full relative" setApi={(api) => api?.scrollTo(currentImage, true)}>
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <Image 
                        src={image}
                        alt={`${car.title} - Imagen ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                        priority={index === 0}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
            </Carousel>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    className={`relative aspect-video rounded-md overflow-hidden ${
                      currentImage === index ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${car.title} - Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 20vw, 10vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Car details sections */}
          <div className="mt-8">
            <CarSections />
          </div>
        </div>
        
        {/* Right column with summary and actions */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Reservation status if the car is reserved */}
            <ReservationStatus carId={car.id} />
            
            {/* Car summary card */}
            <div className="border rounded-lg p-6 shadow-sm">
              <h1 className="text-2xl font-bold">{car.title}</h1>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">{car.year}</Badge>
                <Badge variant="outline">{car.brand}</Badge>
                <Badge variant="outline">{car.transmission}</Badge>
                <Badge variant="outline">{car.fuelType}</Badge>
              </div>
              
              <p className="text-3xl font-bold mt-4">{formatCurrency(car.price)}</p>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <ReserveCarButton carId={car.id} price={car.price} title={car.title} />
                
                <ContactSellerDialog 
                  car={car} 
                  isOpen={isContactOpen} 
                  onOpenChange={setIsContactOpen}
                  onSendMessage={async (message: ContactMessageData) => {
                    await handleSendMessage(message);
                  }}
                />

                <Button  
                onClick={() => setIsContactOpen(true)} 
                variant="outline" 
                className="w-full bg-secondary text-primary"
                >
                  Contactar vendedor
                </Button>
                
                <Button onClick={handleShare} variant="outline" className="w-full">
                  Compartir
                </Button>

              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>ID: {car.id}</p>
                <p>Publicado: {new Date(car.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 