'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from '@/utils/translation-context';
import { CarFilters as CarFiltersType } from '@/types/car';

interface CarFiltersProps {
  onApplyFilters: (filters: CarFiltersType) => void;
  onClearFilters: () => void;
  initialFilters?: CarFiltersType;
  minPriceRange?: number;
  maxPriceRange?: number;
  minYearRange?: number;
  maxYearRange?: number;
  availableBrands: string[];
}

export function CarFilters({
  onApplyFilters,
  onClearFilters,
  initialFilters = {},
  minPriceRange = 0,
  maxPriceRange = 10000000,
  minYearRange = 1990,
  maxYearRange = new Date().getFullYear() + 1,
  availableBrands = [],
}: CarFiltersProps) {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<CarFiltersType>({
    minPrice: initialFilters.minPrice || minPriceRange,
    maxPrice: initialFilters.maxPrice || maxPriceRange,
    minYear: initialFilters.minYear || minYearRange,
    maxYear: initialFilters.maxYear || maxYearRange,
    brands: initialFilters.brands || [],
    models: initialFilters.models || [],
    categories: initialFilters.categories || [],
    transmissions: initialFilters.transmissions || [],
    fuelTypes: initialFilters.fuelTypes || [],
    maxMileage: initialFilters.maxMileage || undefined,
  });

  const handlePriceChange = (value: number[]) => {
    setFilters({
      ...filters,
      minPrice: value[0],
      maxPrice: value[1],
    });
  };

  const handleYearChange = (value: number[]) => {
    setFilters({
      ...filters,
      minYear: value[0],
      maxYear: value[1],
    });
  };

  const handleChange = (key: keyof CarFiltersType, value: string | number | undefined) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  const handleSingleSelection = (
    key: 'brands' | 'models' | 'categories' | 'transmissions' | 'fuelTypes',
    value: string,
  ) => {
    if (value === 'all') {
      setFilters({
        ...filters,
        [key]: [],
      });
      return;
    }

    // Para categorías, transmisiones y tipos de combustible, mantenemos un solo valor seleccionado
    setFilters({
      ...filters,
      [key]: [value],
    });
  };

  const handleClear = () => {
    setFilters({
      minPrice: minPriceRange,
      maxPrice: maxPriceRange,
      minYear: minYearRange,
      maxYear: maxYearRange,
      brands: [],
      models: [],
      categories: [],
      transmissions: [],
      fuelTypes: [],
      maxMileage: undefined,
    });
    onClearFilters();
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  // Obtener el primer valor de los arrays (o undefined si están vacíos)
  const selectedBrand = filters.brands && filters.brands.length > 0 ? filters.brands[0] : 'all';
  const selectedModel = filters.models && filters.models.length > 0 ? filters.models[0] : '';
  const selectedCategory =
    filters.categories && filters.categories.length > 0 ? filters.categories[0] : 'all';
  const selectedTransmission =
    filters.transmissions && filters.transmissions.length > 0 ? filters.transmissions[0] : 'all';
  const selectedFuelType =
    filters.fuelTypes && filters.fuelTypes.length > 0 ? filters.fuelTypes[0] : 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-lg">{t('cars.filters.title')}</h3>
        <div className="flex flex-col lg:flex-row gap-2">
          <Button onClick={handleApply} className="flex-1">
            {t('cars.filters.applyFilters')}
          </Button>
          <Button onClick={handleClear} variant="outline" className="flex-1">
            {t('cars.filters.clearFilters')}
          </Button>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['price', 'year', 'category']}>
        {/* Filtro de Precio */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium">
            {t('cars.filters.price')}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <Slider
                defaultValue={[
                  filters.minPrice || minPriceRange,
                  filters.maxPrice || maxPriceRange,
                ]}
                min={minPriceRange}
                max={maxPriceRange}
                step={50000}
                onValueChange={handlePriceChange}
              />
              <div className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">{t('cars.filters.priceRange')}:</span>{' '}
                  <span>
                    ${(filters.minPrice || minPriceRange).toLocaleString()} - $
                    {(filters.maxPrice || maxPriceRange).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Filtro de Año */}
        <AccordionItem value="year">
          <AccordionTrigger className="text-sm font-medium">
            {t('cars.filters.year')}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <Slider
                defaultValue={[filters.minYear || minYearRange, filters.maxYear || maxYearRange]}
                min={minYearRange}
                max={maxYearRange}
                step={1}
                onValueChange={handleYearChange}
              />
              <div className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">{t('cars.filters.yearRange')}:</span>{' '}
                  <span>
                    {filters.minYear || minYearRange} - {filters.maxYear || maxYearRange}
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Filtro de Marca */}
        <AccordionItem value="brand">
          <AccordionTrigger className="text-sm font-medium">
            {t('cars.filters.brand')}
          </AccordionTrigger>
          <AccordionContent>
            <Select
              value={selectedBrand}
              onValueChange={(value) => handleSingleSelection('brands', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {availableBrands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>

        {/* Filtro de Modelo */}
        <AccordionItem value="model">
          <AccordionTrigger className="text-sm font-medium">
            {t('cars.filters.model')}
          </AccordionTrigger>
          <AccordionContent>
            <Input
              placeholder="Modelo"
              value={selectedModel}
              onChange={(e) => handleSingleSelection('models', e.target.value)}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Filtro de Categoría */}
        <AccordionItem value="category">
          <AccordionTrigger className="text-sm font-medium">
            {t('cars.filters.category')}
          </AccordionTrigger>
          <AccordionContent>
            <Select
              value={selectedCategory}
              onValueChange={(value) => handleSingleSelection('categories', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="sedan">Sedán</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="hatchback">Hatchback</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="convertible">Convertible</SelectItem>
                <SelectItem value="coupe">Coupé</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>

        {/* Filtro de Transmisión */}
        <AccordionItem value="transmission">
          <AccordionTrigger className="text-sm font-medium">
            {t('cars.filters.transmission')}
          </AccordionTrigger>
          <AccordionContent>
            <Select
              value={selectedTransmission}
              onValueChange={(value) => handleSingleSelection('transmissions', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar transmisión" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las transmisiones</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automatic">Automática</SelectItem>
                <SelectItem value="cvt">CVT</SelectItem>
                <SelectItem value="semi-automatic">Semi-automática</SelectItem>
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>

        {/* Filtro de Combustible */}
        <AccordionItem value="fuelType">
          <AccordionTrigger className="text-sm font-medium">
            {t('cars.filters.fuel')}
          </AccordionTrigger>
          <AccordionContent>
            <Select
              value={selectedFuelType}
              onValueChange={(value) => handleSingleSelection('fuelTypes', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar combustible" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los combustibles</SelectItem>
                <SelectItem value="gasoline">Gasolina</SelectItem>
                <SelectItem value="diesel">Diésel</SelectItem>
                <SelectItem value="electric">Eléctrico</SelectItem>
                <SelectItem value="hybrid">Híbrido</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>

        {/* Filtro de Kilometraje */}
        <AccordionItem value="mileage">
          <AccordionTrigger className="text-sm font-medium">
            {t('cars.filters.mileage')}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Label htmlFor="maxMileage">Kilometraje máximo (km)</Label>
              <Input
                id="maxMileage"
                type="number"
                placeholder="Kilometraje máximo"
                value={filters.maxMileage || ''}
                onChange={(e) =>
                  handleChange('maxMileage', e.target.value ? parseInt(e.target.value) : undefined)
                }
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
