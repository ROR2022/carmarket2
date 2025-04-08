import { CarCategory, FuelType, Transmission } from './car';

export type ListingStatus = 'active' | 'pending' | 'approved' | 'sold' | 'expired' | 'draft' | 'rejected' | 'changes_requested' | 'reserved';

export interface CarListing {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  features: string[];
  description: string;
  location: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  status: ListingStatus;
  viewCount: number;
  contactCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface ValuationRequest {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  category: CarCategory;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  extras: string[];
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
}

export interface ValuationResponse {
  estimatedPrice: {
    min: number;
    max: number;
    average: number;
  };
  valuationId: string;
  expiresAt: string; // La valoración expira después de cierto tiempo
  recommendedListingPrice: number;
  marketAnalysis: {
    averageTimeOnMarket: number; // días
    demandLevel: 'high' | 'medium' | 'low';
    similarListingsCount: number;
  };
}

export interface ListingFormData {
  // Datos básicos del vehículo
  brand: string;
  model: string;
  year: number;
  category: CarCategory;
  
  // Detalles técnicos
  transmission: Transmission;
  fuelType: FuelType;
  mileage: number;
  color: string;
  vinNumber?: string;
  licensePlate?: string;
  
  // Características adicionales
  features: string[];
  description: string;
  
  // Ubicación y contacto
  location: string;
  sellerName: string;
  sellerPhone?: string;
  sellerEmail: string;
  
  // Precio y condiciones
  price: number;
  negotiable: boolean;
  acceptsTrade: boolean;
  
  // Imágenes y documentos
  images: File[] | string[];
  documents?: File[] | string[];
} 