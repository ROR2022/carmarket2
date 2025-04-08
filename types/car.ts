export type Transmission = 'automatic' | 'manual' | 'cvt' | 'semi-automatic';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'plugin_hybrid' | 'cng' | 'lpg';
export type CarCategory = 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'coupe' | 'van' | 'convertible' | 'wagon';

export interface Car {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  category: CarCategory;
  price: number;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  features: string[];
  description: string;
  location: string;
  images: string[];
  sellerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CarFilters {
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  brands?: string[];
  models?: string[];
  categories?: CarCategory[];
  transmissions?: Transmission[];
  fuelTypes?: FuelType[];
  minMileage?: number;
  maxMileage?: number;
  sellerIds?: string[];
  searchTerm?: string;
}

export type SortOption = 
  | 'price_asc' 
  | 'price_desc' 
  | 'year_asc' 
  | 'year_desc' 
  | 'mileage_asc' 
  | 'mileage_desc' 
  | 'created_desc' 
  | 'created_asc';

export interface CarListResponse {
  cars: Car[];
  pagination: PaginationInfo;
} 