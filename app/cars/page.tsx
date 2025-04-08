'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { Loader2 } from 'lucide-react';
//import { CatalogService } from '@/services/catalog';
import axios from 'axios';

export default function CarsPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  
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
  
  // Inicializar filtros desde parámetros de URL si existen
  const initialFilters = React.useMemo(() => {
    const searchTerm = searchParams.get('searchTerm');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const category = searchParams.get('category');
    
    const filters: CarFiltersType = {};
    
    if (searchTerm) filters.searchTerm = searchTerm;
    if (brand) filters.brands = [brand];
    if (category) filters.categories = [category as CarCategory];
    if (minPrice) filters.minPrice = parseInt(minPrice);
    if (maxPrice) filters.maxPrice = parseInt(maxPrice);
    
    return filters;
  }, [searchParams]);
  
  const [filters, setFilters] = useState<CarFiltersType>(initialFilters);
  const [sortOption, setSortOption] = useState<SortOption>('created_desc');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  
  // Referencias para controlar la carga y los cambios de usuario
  const initialLoadRef = React.useRef(false);
  const userInitiatedChange = React.useRef(false);
  const isVisibleRef = React.useRef(true);
  
  // Monitor de visibilidad del documento
  useEffect(() => {
    // Función para manejar cambios de visibilidad
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      console.log('Visibility changed:', isVisible);
      
      // Si volvemos a la pestaña y la carga ya se completó anteriormente,
      // no queremos que se vuelva a cargar automáticamente
      if (isVisible && initialLoadRef.current) {
        console.log('Page became visible again, preventing auto-reload');
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
  
  // Efecto para inicializar los filtros desde URL al montar el componente
  useEffect(() => {
    // Solo aplicar los filtros iniciales si hay algún parámetro
    if (Object.keys(initialFilters).length > 0) {
      userInitiatedChange.current = true;
    }
  }, [initialFilters]);
  
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
  
  // Cargar autos al iniciar o cambiar filtros/página
  useEffect(() => {
    const loadCars = async () => {
      // Si ya se cargó inicialmente y no es un cambio iniciado por el usuario, no recargar
      if (initialLoadRef.current && !userInitiatedChange.current) {
        console.log('Skipping automatic reload - no user initiated change');
        return;
      }
      
      // Si la página no está visible, posponer la carga
      if (!isVisibleRef.current) {
        console.log('Page not visible, postponing load');
        return;
      }
      
      console.log('Loading cars with filters:', filters, 'page:', pagination.currentPage, 'sort:', sortOption);
      
      setLoading(true);
      setError(null);
      
      try {
        /* const result = await CatalogService.searchListings(
          filters,
          pagination.currentPage,
          pagination.pageSize,
          sortOption
        ); */
        const response = await axios.post('/api/catalog', {
          methodSelected: 'searchListings',
          sentParams: {
            filters: filters,
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
        console.error('Error fetching cars:', err);
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
  }, [pagination.currentPage, pagination.pageSize, filters, sortOption, t]);
  
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
  
  // Función para actualizar la URL con los filtros actuales
  const updateUrlWithFilters = (newFilters: CarFiltersType) => {
    const params = new URLSearchParams();
    
    if (newFilters.searchTerm) params.set('searchTerm', newFilters.searchTerm);
    if (newFilters.brands?.length) params.set('brand', newFilters.brands[0]);
    if (newFilters.categories?.length) params.set('category', newFilters.categories[0]);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice.toString());
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice.toString());
    
    // Actualizar la URL sin recargar la página
    const url = params.toString() ? `?${params.toString()}` : '';
    router.push(`/cars${url}`, { scroll: false });
  };
  
  // Aplicar filtros
  const handleApplyFilters = (newFilters: CarFiltersType) => {
    // Marcar que este es un cambio iniciado por el usuario
    userInitiatedChange.current = true;
    
    setFilters(newFilters);
    setPagination(prev => ({
      ...prev,
      currentPage: 1  // Volver a la primera página al aplicar filtros
    }));
    
    // Actualizar la URL con los nuevos filtros
    updateUrlWithFilters(newFilters);
  };
  
  // Limpiar filtros
  const handleClearFilters = () => {
    // Marcar que este es un cambio iniciado por el usuario
    userInitiatedChange.current = true;
    
    setFilters({});
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
    
    // Limpiar la URL
    router.push('/cars', { scroll: false });
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
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {t('cars.pageTitle')}
        </h1>
        <p className="max-w-[800px] text-muted-foreground md:text-xl">
          {t('cars.pageSubtitle')}
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
              {filters.searchTerm && (
                <span className="ml-1">
                  {t('cars.for_search')} &ldquo;<span className="font-medium">{filters.searchTerm}</span>&rdquo;
                </span>
              )}
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
              <p>{t('cars.noResults')}</p>
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