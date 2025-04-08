'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/utils/translation-context';
import { CarCategory } from '@/types/car';

// Categorías de vehículos para la sección de explorar
const categories: { id: CarCategory; title: string; image: string; description: string }[] = [
  {
    id: 'sedan',
    title: 'Sedán',
    description: 'Vehículos ideales para la ciudad con gran comodidad y economía',
    image: '/images/cars/sedan.jpeg',
  },
  {
    id: 'suv',
    title: 'SUV',
    description: 'Vehículos versátiles con mayor espacio y capacidad todoterreno',
    image: '/images/cars/suv.jpeg',
  },
  {
    id: 'hatchback',
    title: 'Hatchback',
    description: 'Compactos, ágiles y con gran aprovechamiento del espacio',
    image: '/images/cars/hatchback.jpeg',
  },
  {
    id: 'pickup',
    title: 'Pickup',
    description: 'Robustas y potentes para trabajo o aventura',
    image: '/images/cars/pickup.jpeg',
  },
];

// Componente para la sección de categorías en la página principal
export function CarCategoriesSection() {
  const { t } = useTranslation();
  
  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-900/50">
      <div className="container">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            {t('homePage.explore_categories')}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-3xl">
            {t('homePage.categories_description')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden group transition-all hover:shadow-md">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                  <div className="p-4 text-white">
                    <h3 className="font-bold text-xl mb-1">{category.title}</h3>
                  </div>
                </div>
              </div>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full gap-1">
                  <Link href={`/cars/category/${category.id}`}>
                    {t('homePage.view_category')}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="flex justify-center mt-12">
          <Button asChild variant="outline" size="lg">
            <Link href="/cars">
              {t('homePage.view_all_cars')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// Componente para la sección de cómo funciona en la página principal
export function HowItWorksSection() {
  const { t } = useTranslation();
  
  const steps = [
    {
      number: '01',
      title: t('homePage.steps.browse.title'),
      description: t('homePage.steps.browse.description'),
    },
    {
      number: '02',
      title: t('homePage.steps.contact.title'),
      description: t('homePage.steps.contact.description'),
    },
    {
      number: '03',
      title: t('homePage.steps.visit.title'),
      description: t('homePage.steps.visit.description'),
    },
    {
      number: '04',
      title: t('homePage.steps.purchase.title'),
      description: t('homePage.steps.purchase.description'),
    },
  ];
  
  return (
    <section className="py-16">
      <div className="container">
        <div className="flex flex-col items-center text-center mb-12">
          <Badge className="mb-4">{t('homePage.how_it_works')}</Badge>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('homePage.buying_process')}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-3xl">
            {t('homePage.process_description')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              <div className="absolute -left-2 -top-2 bg-primary text-primary-foreground text-sm font-bold h-8 w-8 rounded-full flex items-center justify-center">
                {step.number}
              </div>
              <Card className="h-full">
                <CardHeader className="pt-8">
                  <CardTitle>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center mt-12">
          <Button asChild size="lg">
            <Link href="/cars">
              {t('homePage.start_browsing')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// Componente para la sección de banner de venta en la página principal
export function SellBannerSection() {
  const { t } = useTranslation();
  
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-lg">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              {t('homePage.sell_banner.title')}
            </h2>
            <p className="mb-6 text-primary-foreground/90">
              {t('homePage.sell_banner.description')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" size="lg" asChild>
                <Link href="/sell">
                  {t('homePage.sell_banner.list_now')}
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="bg-transparent border-white text-white hover:bg-white/20">
                <Link href="/about">
                  {t('homePage.sell_banner.learn_more')}
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative w-full max-w-md aspect-[4/3]">
            <Image
              src="/images/cars/sell-banner.jpg"
              alt="Vende tu auto"
              fill
              className="object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
} 