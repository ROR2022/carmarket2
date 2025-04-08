'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CarCard } from '@/components/car/car-card';
import { CarFilters } from '@/components/car/car-filters';
import { CarPagination } from '@/components/car/car-pagination';
import { useTranslation } from '@/utils/translation-context';
import { Car, CarFilters as CarFiltersType, PaginationInfo, SortOption, CarCategory } from '@/types/car';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { capitalize } from '@/utils/format';
//import { CatalogService } from '@/services/catalog';
import axios from 'axios';
// Función para obtener un título amigable para cada categoría
const getCategoryTitle = (category: string): string => {
  switch (category) {
    case 'sedan':
      return 'Sedanes';
    case 'suv':
      return 'SUVs';
    case 'hatchback':
      return 'Hatchbacks';
    case 'pickup':
      return 'Camionetas';
    case 'convertible':
      return 'Convertibles';
    case 'coupe':
      return 'Coupé';
    default:
      return capitalize(category);
  }
};

export default function CategoryPage() {
  const { t } = useTranslation();
  const params = useParams();
  const category = params.category as CarCategory;
  const categoryName = getCategoryTitle(category);
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 9,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState<CarFiltersType>({
    categories: [category] // Configurar categoría desde la URL por defecto
  });
  const [sortOption, setSortOption] = useState<SortOption>('created_desc');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  
  // Referencias para controlar la carga y los cambios de usuario
  const initialLoadRef = React.useRef(false);
  const userInitiatedChange = React.useRef(false);
  const lastCategoryRef = React.useRef(category);
  const isVisibleRef = React.useRef(true);
  
  // Monitor de visibilidad del documento
  useEffect(() => {
    // Función para manejar cambios de visibilidad
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      console.log('Visibility changed in category view:', isVisible);
      
      // Si volvemos a la pestaña y la carga ya se completó anteriormente,
      // no queremos que se vuelva a cargar automáticamente
      if (isVisible && initialLoadRef.current) {
        console.log('Category page became visible again, preventing auto-reload');
        userInitiatedChange.current = false;
      }
      
      isVisibleRef.current = isVisible;
    };
    
    // Agregar el listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpiar al desmontar
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Cargar marcas disponibles
  useEffect(() => {
    const loadBrands = async () => {
      try {
        //const brands = await CatalogService.getAvailableBrands();
        const response = await axios.post('/api/catalog', {
          methodSelected: 'getAvailableBrands',
          sentParams: {}
        });
        const brands = response.data;
        setAvailableBrands(brands);
      } catch (err) {
        console.error('Error loading brands:', err);
      }
    };
    
    loadBrands();
  }, []);
  
  // Reiniciar estado cuando cambia la categoría
  useEffect(() => {
    if (category !== lastCategoryRef.current) {
      // Si la categoría cambió, necesitamos reiniciar
      initialLoadRef.current = false;
      lastCategoryRef.current = category;
      userInitiatedChange.current = true;
      
      // Actualizar filtros para la nueva categoría
      setFilters({
        categories: [category]
      });
      
      // Reiniciar a la primera página
      setPagination(prev => ({
        ...prev,
        currentPage: 1
      }));
    }
  }, [category]);
  
  // Cargar autos al iniciar o cambiar filtros/página
  useEffect(() => {
    const loadCars = async () => {
      // Si ya se cargó inicialmente y no es un cambio iniciado por el usuario, no recargar
      if (initialLoadRef.current && !userInitiatedChange.current) {
        console.log('Skipping automatic reload - no user initiated change in category view');
        return;
      }
      
      // Si la página no está visible, posponer la carga
      if (!isVisibleRef.current) {
        console.log('Category page not visible, postponing load');
        return;
      }
      
      console.log('Loading category cars with filters:', filters, 'page:', pagination.currentPage, 'sort:', sortOption);
      
      setLoading(true);
      setError(null);
      
      // Asegurarnos de que siempre filtramos por la categoría actual
      const categoryFilters = {
        ...filters,
        categories: [category]
      };
      
      try {
        /* const result = await CatalogService.searchListings(
          categoryFilters,
          pagination.currentPage,
          pagination.pageSize,
          sortOption
        ); */
        const response = await axios.post('/api/catalog', {
          methodSelected: 'searchListings',
          sentParams: {
            filters: categoryFilters,
            page: pagination.currentPage,
            pageSize: pagination.pageSize,
            sort: sortOption
          }
        });
        const result = response.data;
        
        setCars(result.cars);
        
        // Actualizar la paginación de manera selectiva para evitar ciclos
        // Usamos una función para garantizar que estamos trabajando con el último estado
        setPagination(prev => {
          // Verificar si realmente hubo cambios para evitar actualizaciones innecesarias
          if (
            prev.totalPages === result.pagination.totalPages &&
            prev.totalItems === result.pagination.totalItems &&
            prev.hasNext === result.pagination.hasNext &&
            prev.hasPrev === result.pagination.hasPrev
          ) {
            return prev; // No hay cambios reales, evitar actualización
          }
          
          // Actualizar solo si hay cambios
          return {
            ...prev,
            totalPages: result.pagination.totalPages,
            totalItems: result.pagination.totalItems,
            hasNext: result.pagination.hasNext,
            hasPrev: result.pagination.hasPrev
          };
        });
        
        // Marcar que ya se realizó la carga inicial
        initialLoadRef.current = true;
      } catch (err) {
        console.error('Error fetching category cars:', err);
        setError(t('cars.error'));
      } finally {
        setLoading(false);
        // Reiniciar el indicador de cambio iniciado por el usuario
        userInitiatedChange.current = false;
      }
    };
    
    // Ejecutar inmediatamente si tenemos un cambio iniciado por el usuario
    if (userInitiatedChange.current) {
      loadCars();
    } 
    // O con un pequeño retraso para evitar carreras de condición en actualizaciones rápidas
    else {
      const timer = setTimeout(() => {
        loadCars();
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [pagination.currentPage, pagination.pageSize, filters, sortOption, category, t]);
  
  // Gestionar cambios de página
  const handlePageChange = (page: number) => {
    // Marcar que este es un cambio iniciado por el usuario
    userInitiatedChange.current = true;
    
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
    
    // Scroll al inicio de la lista
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Aplicar filtros
  const handleApplyFilters = (newFilters: CarFiltersType) => {
    // Marcar que este es un cambio iniciado por el usuario
    userInitiatedChange.current = true;
    
    // Mantener la categoría en los filtros
    setFilters({
      ...newFilters,
      categories: [category]
    });
    
    setPagination(prev => ({
      ...prev,
      currentPage: 1  // Volver a la primera página al aplicar filtros
    }));
  };
  
  // Limpiar filtros
  const handleClearFilters = () => {
    // Marcar que este es un cambio iniciado por el usuario
    userInitiatedChange.current = true;
    
    // Mantener solo el filtro de categoría
    setFilters({
      categories: [category]
    });
    
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };
  
  // Gestionar cambio de ordenamiento
  const handleSortChange = (value: string) => {
    // Marcar que este es un cambio iniciado por el usuario
    userInitiatedChange.current = true;
    
    setSortOption(value as SortOption);
  };
  
  // Gestionar favoritos
  const handleToggleFavorite = (carId: string) => {
    setFavorites(prev => {
      if (prev.includes(carId)) {
        return prev.filter(id => id !== carId);
      } else {
        return [...prev, carId];
      }
    });
  };
  
  return (
    <div className="container py-10">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" className="mb-2" asChild>
            <Link href="/cars">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('common.back_to_all_cars')}
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {categoryName}
        </h1>
        <p className="max-w-[800px] text-muted-foreground md:text-xl">
          {t(`categories.${category}_description`)}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Columna de filtros */}
        <div className="md:col-span-1">
          <div className="sticky top-24">
            <CarFilters
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              initialFilters={filters}
              availableBrands={availableBrands}
            />
          </div>
        </div>
        
        {/* Columna principal de contenido */}
        <div className="md:col-span-3">
          {/* Ordenamiento y resumen de resultados */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              {pagination.totalItems} {pagination.totalItems === 1 ? 'vehículo' : 'vehículos'} encontrados
            </p>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('cars.sort.title')}</span>
              <Select
                value={sortOption}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">{t('cars.sort.newest')}</SelectItem>
                  <SelectItem value="price_desc">{t('cars.sort.priceHighToLow')}</SelectItem>
                  <SelectItem value="price_asc">{t('cars.sort.priceLowToHigh')}</SelectItem>
                  <SelectItem value="year_desc">{t('cars.sort.yearNewest')}</SelectItem>
                  <SelectItem value="year_asc">{t('cars.sort.yearOldest')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Estado de carga */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p>{t('cars.loading')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-12">
              <p>{t('cars.noCarsInCategory')}</p>
            </div>
          ) : (
            <>
              {/* Cuadrícula de autos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {cars.map(car => (
                  <CarCard
                    key={car.id}
                    car={car}
                    isFavorite={favorites.includes(car.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
              
              {/* Paginación */}
              <CarPagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
} 