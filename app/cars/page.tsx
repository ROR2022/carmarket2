"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CarCard } from "@/components/car/car-card";
import { CarFilters } from "@/components/car/car-filters";
import { CarPagination } from "@/components/car/car-pagination";
import { useTranslation } from "@/utils/translation-context";
import {
  Car,
  CarFilters as CarFiltersType,
  PaginationInfo,
  SortOption,
  CarCategory,
} from "@/types/car";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
//import { CatalogService } from '@/services/catalog';
import axios from "axios";

type TMyParasm = {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
};

const initialFilters: CarFiltersType = {
  searchTerm: "",
  brands: [],
  categories: [],
  minPrice: undefined,
  maxPrice: undefined,
};

// Client component that uses navigation hooks
function CarsPageContent() {
  console.log("DEBUG: CarsPage component rendering");
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Track component mount/unmount for debugging
  useEffect(() => {
    console.log("DEBUG: CarsPage component mounted");
    return () => {
      console.log("DEBUG: CarsPage component unmounting");
    };
  }, []);

  // Extract URL parameters directly in the component using useMemo
  const urlParams = useMemo(() => {
    console.log("DEBUG: Computing urlParams");
    
    // Special case: detect empty URL (no parameters)
    const hasNoParams = searchParams.toString() === '';
    if (hasNoParams) {
      console.log("DEBUG: Empty URL parameters detected, returning empty params object");
      return {};
    }
    
    const params: TMyParasm = {};
    
    const brand = searchParams.get("brand");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const category = searchParams.get("category");
    const searchTerm = searchParams.get("searchTerm");
    
    if (brand) params.brand = brand;
    if (minPrice) params.minPrice = parseInt(minPrice);
    if (maxPrice) params.maxPrice = parseInt(maxPrice);
    if (category) params.category = category;
    if (searchTerm) params.searchTerm = searchTerm;
    
    return params;
  }, [searchParams]);

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
    hasPrev: false,
  });

  const [filters, setFilters] = useState<CarFiltersType>(initialFilters);
  const [sortOption, setSortOption] = useState<SortOption>("created_desc");
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
      const isVisible = document.visibilityState === "visible";
      console.log("Visibility changed:", isVisible);

      // Si volvemos a la pestaña y la carga ya se completó anteriormente,
      // no queremos que se vuelva a cargar automáticamente
      if (isVisible && initialLoadRef.current) {
        console.log("Page became visible again, preventing auto-reload");
        userInitiatedChange.current = false;
      }

      isVisibleRef.current = isVisible;
    };

    // Agregar el listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Limpiar al desmontar
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Replace the filters useEffect with a useMemo hook
  const derivedFilters = useMemo(() => {
    console.log("DEBUG: Computing derivedFilters from urlParams");
    
    // Explicit handling for empty URL parameters - reset to initial filters
    if (Object.keys(urlParams).length === 0) {
      console.log("DEBUG: No URL parameters detected, resetting to initial filters");
      return initialFilters;
    }
    
    // For partial parameters, start with initial filters and override
    const newFilters: CarFiltersType = { ...initialFilters };
    
    if (urlParams.brand) {
      newFilters.brands = [urlParams.brand];
    } else {
      newFilters.brands = [];
    }
    
    if (urlParams.category) {
      newFilters.categories = [urlParams.category as CarCategory];
    } else {
      newFilters.categories = [];
    }
    
    if (urlParams.minPrice !== undefined) {
      newFilters.minPrice = urlParams.minPrice;
    }
    
    if (urlParams.maxPrice !== undefined) {
      newFilters.maxPrice = urlParams.maxPrice;
    }
    
    if (urlParams.searchTerm) {
      newFilters.searchTerm = urlParams.searchTerm;
    } else {
      newFilters.searchTerm = "";
    }
    
    console.log("DEBUG: Derived filters result:", newFilters);
    return newFilters;
  }, [urlParams]);

  // Log all important state changes to help debug
  useEffect(() => {
    console.log("DEBUG: === STATE CHANGE LOG ===");
    console.log("urlParams:", urlParams);
    console.log("filters:", filters);
    console.log("pagination:", pagination);
    console.log("sortOption:", sortOption);
    console.log("userInitiatedChange:", userInitiatedChange.current);
    console.log("initialLoadRef:", initialLoadRef.current);
    console.log("===========================");
  }, [urlParams, filters, pagination, sortOption]);

  // Effect to update filters state only when derivedFilters actually changes
  useEffect(() => {
    // Only update filters if they're actually different
    const currentFiltersStr = JSON.stringify(filters);
    const newFiltersStr = JSON.stringify(derivedFilters);
    
    if (currentFiltersStr !== newFiltersStr) {
      console.log("DEBUG: Updating filters with derivedFilters", derivedFilters);
      setFilters(derivedFilters);
    }
  }, [derivedFilters, filters]);

  // Cargar marcas disponibles
  useEffect(() => {
    const loadBrands = async () => {
      try {
        //const brands = await CatalogService.getAvailableBrands();
        const response = await axios.post("/api/catalog", {
          methodSelected: "getAvailableBrands",
          sentParams: {},
        });
        const brands = response.data;
        setAvailableBrands(brands);
      } catch (err) {
        console.error("Error loading brands:", err);
      }
    };

    loadBrands();
  }, []);

  // Consolidated car loading effect with proper debouncing and error handling
  useEffect(() => {
    console.log("DEBUG: Consolidated loadCars useEffect running", { 
      filters, 
      currentPage: pagination.currentPage,
      userInitiated: userInitiatedChange.current
    });
    
    const loadCars = async () => {
      // Skip loading if conditions aren't right
      if (initialLoadRef.current && !userInitiatedChange.current) {
        console.log("Skipping automatic reload - no user initiated change");
        return;
      }

      // Skip loading if page isn't visible
      if (!isVisibleRef.current) {
        console.log("Page not visible, postponing load");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.post("/api/catalog", {
          methodSelected: "searchListings",
          sentParams: {
            filters: filters,
            page: pagination.currentPage,
            pageSize: pagination.pageSize,
            sort: sortOption,
          },
        });
        
        const result = response.data;
        console.log("Cars loaded successfully:", result);

        setCars(result.cars);

        // Update pagination only if values actually changed
        setPagination((prev) => {
          if (
            prev.totalPages === result.pagination.totalPages &&
            prev.totalItems === result.pagination.totalItems &&
            prev.hasNext === result.pagination.hasNext &&
            prev.hasPrev === result.pagination.hasPrev
          ) {
            return prev; // No actual changes, avoid re-render
          }

          return {
            ...prev,
            totalPages: result.pagination.totalPages,
            totalItems: result.pagination.totalItems,
            hasNext: result.pagination.hasNext,
            hasPrev: result.pagination.hasPrev,
          };
        });

        // Mark initial load as completed
        initialLoadRef.current = true;
      } catch (err) {
        console.error("Error fetching cars:", err);
        setError(t("cars.error"));
        setCars([]); // Clear cars on error
      } finally {
        setLoading(false);
        userInitiatedChange.current = false;
      }
    };

    // Use debouncing to prevent rapid consecutive calls
    // Run immediately for user-initiated changes, or with a slight delay for auto-changes
    const timer = setTimeout(
      loadCars, 
      userInitiatedChange.current ? 0 : 100
    );
    
    return () => clearTimeout(timer);
  }, [filters, pagination.currentPage, pagination.pageSize, sortOption, t]);

  // Track pathname changes to detect navigation to base /cars path
  useEffect(() => {
    console.log("DEBUG: Pathname changed to:", pathname);
    
    // Check if we're at exactly /cars with no query parameters
    if (pathname === '/cars' && searchParams.toString() === '') {
      console.log("DEBUG: Detected navigation to base /cars path");
      
      // Only reset if we actually have filters active
      if (filters.searchTerm || 
          filters.brands?.length || 
          filters.categories?.length || 
          filters.minPrice || 
          filters.maxPrice) {
            
        console.log("DEBUG: Resetting filters due to navigation to /cars");
        userInitiatedChange.current = true;
        setFilters(initialFilters);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      }
    }
  }, [pathname, searchParams, filters, initialFilters]);

  // Improved handler for page changes 
  const handlePageChange = (page: number) => {
    console.log("DEBUG: handlePageChange", { page, current: pagination.currentPage });
    
    // Skip if same page
    if (page === pagination.currentPage) return;
    
    // Mark as user initiated
    userInitiatedChange.current = true;

    // Update pagination with callback to ensure we use the latest state
    setPagination((prev) => ({
      ...prev,
      currentPage: page,
    }));

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Improved URL update function
  const updateUrlWithFilters = (newFilters: CarFiltersType) => {
    const params = new URLSearchParams();

    if (newFilters.searchTerm) params.set("searchTerm", newFilters.searchTerm);
    if (newFilters.brands?.length) params.set("brand", newFilters.brands[0]);
    if (newFilters.categories?.length)
      params.set("category", newFilters.categories[0]);
    if (newFilters.minPrice)
      params.set("minPrice", newFilters.minPrice.toString());
    if (newFilters.maxPrice)
      params.set("maxPrice", newFilters.maxPrice.toString());

    // Update URL without reloading the page
    const url = params.toString() ? `?${params.toString()}` : "";
    console.log("DEBUG: Updating URL", url);
    router.push(`/cars${url}`, { scroll: false });
  };

  // Improved filter application handler
  const handleApplyFilters = (newFilters: CarFiltersType) => {
    console.log("DEBUG: handleApplyFilters", newFilters);
    
    // Compare if filters actually changed
    const currentFiltersStr = JSON.stringify(filters);
    const newFiltersStr = JSON.stringify(newFilters);
    
    if (currentFiltersStr === newFiltersStr) {
      console.log("DEBUG: Filters unchanged, skipping update");
      return;
    }
    
    // Mark as user initiated
    userInitiatedChange.current = true;

    // Update filters
    setFilters(newFilters);
    
    // Reset to first page
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }));

    // Update URL for bookmarking/sharing
    updateUrlWithFilters(newFilters);
  };

  // Add a dedicated handler for navigating to all cars view
  const handleViewAllCars = () => {
    console.log("DEBUG: handleViewAllCars called");
    userInitiatedChange.current = true;
    
    // Explicitly reset all filters to initial state
    setFilters(initialFilters);
    
    // Reset pagination
    setPagination(prev => ({ 
      ...prev, 
      currentPage: 1 
    }));
    
    // Navigate to base cars URL
    router.push("/cars", { scroll: false });
  };

  // Improved filter clearing - now using our common handler
  const handleClearFilters = () => {
    console.log("DEBUG: handleClearFilters");
    handleViewAllCars();
  };

  // Improved sort change handler
  const handleSortChange = (value: string) => {
    console.log("DEBUG: handleSortChange", value);
    
    if (value === sortOption) return;
    
    // Mark as user initiated
    userInitiatedChange.current = true;
    
    // Update sort option
    setSortOption(value as SortOption);
  };

  // Gestionar favoritos
  const handleToggleFavorite = (carId: string) => {
    setFavorites((prev) => {
      if (prev.includes(carId)) {
        return prev.filter((id) => id !== carId);
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
        
        {/* Add a "View All Cars" button that's visible when filters are active */}
        {(filters.searchTerm || filters.brands?.length || filters.categories?.length || 
          filters.minPrice || filters.maxPrice) && (
          <button 
            onClick={handleViewAllCars}
            className="text-primary hover:underline"
          >
            {t('common.view_all')}
          </button>
        )}
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
              {pagination.totalItems}{" "}
              {pagination.totalItems === 1 ? "vehículo" : "vehículos"}{" "}
              encontrados
              {filters.searchTerm && (
                <span className="ml-1">
                  {t("cars.for_search")} &ldquo;
                  <span className="font-medium">{filters.searchTerm}</span>
                  &rdquo;
                </span>
              )}
            </p>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {t("cars.sort.title")}
              </span>
              <Select value={sortOption} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">
                    {t("cars.sort.newest")}
                  </SelectItem>
                  <SelectItem value="price_desc">
                    {t("cars.sort.priceHighToLow")}
                  </SelectItem>
                  <SelectItem value="price_asc">
                    {t("cars.sort.priceLowToHigh")}
                  </SelectItem>
                  <SelectItem value="year_desc">
                    {t("cars.sort.yearNewest")}
                  </SelectItem>
                  <SelectItem value="year_asc">
                    {t("cars.sort.yearOldest")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estado de carga */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p>{t("cars.loading")}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-12">
              <p>{t("cars.noResults")}</p>
            </div>
          ) : (
            <>
              {/* Cuadrícula de autos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {cars.map((car) => (
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

// Main page component that uses Suspense
export default function CarsPage() {
  return (
    <Suspense fallback={
      <div className="container py-10 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <CarsPageContent />
    </Suspense>
  );
}
