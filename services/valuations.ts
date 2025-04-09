import { createClient } from '@/utils/supabase/client';

export interface VehicleValuationInput {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  fuelType: string;
  category: string;
  condition: string;
  extras?: string[];
  name?: string;
  email?: string;
  phone?: string;
}

export interface VehicleValuationResult {
  id: string;
  estimatedMinPrice: number;
  estimatedMaxPrice: number;
  recommendedPrice: number;
  expiresAt: string;
  marketAnalysis: {
    averagePrice: number;
    demandLevel: 'high' | 'medium' | 'low';
    similarListings: number;
    salesTime: number; // días promedio para vender
  };
}

export const ValuationService = {
  /**
   * Calcula una valoración para un vehículo
   * @param data Datos del vehículo
   * @param userId ID del usuario (opcional)
   * @returns Resultado de la valoración
   */
  async getValuation(data: VehicleValuationInput, userId?: string): Promise<VehicleValuationResult> {
    const supabase = createClient();
    
    // Algoritmo de valoración (simulación)
    const basePrice = this.calculateBasePrice(data.brand, data.model, data.year);
    
    // Ajustes por factores adicionales
    let adjustedPrice = basePrice;
    adjustedPrice = this.adjustForMileage(adjustedPrice, data.mileage, data.year);
    adjustedPrice = this.adjustForCondition(adjustedPrice, data.condition);
    adjustedPrice = this.adjustForExtras(adjustedPrice, data.extras || []);
    
    // Rango de precios (±10%)
    const minPrice = Math.round(adjustedPrice * 0.9);
    const maxPrice = Math.round(adjustedPrice * 1.1);
    
    // Fecha de expiración (30 días)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Análisis de mercado (simulación)
    const marketAnalysis = {
      averagePrice: Math.round(adjustedPrice * 1.05),
      demandLevel: this.calculateDemandLevel(data.brand, data.model, data.year) as 'high' | 'medium' | 'low',
      similarListings: Math.floor(Math.random() * 50) + 10,
      salesTime: Math.floor(Math.random() * 30) + 15
    };
    
    // Guardar en la base de datos
    const { data: savedValuation, error } = await supabase
      .from('valuations')
      .insert({
        user_id: userId || null,
        brand: data.brand,
        model: data.model,
        year: data.year,
        mileage: data.mileage,
        transmission: data.transmission,
        fuel_type: data.fuelType,
        category: data.category,
        condition: data.condition,
        extras: data.extras || [],
        estimated_min_price: minPrice,
        estimated_max_price: maxPrice,
        recommended_price: adjustedPrice,
        expires_at: expiresAt.toISOString(),
        name: data.name,
        email: data.email,
        phone: data.phone
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error saving valuation:', error);
      throw new Error('Error al guardar la valoración: ' + error.message);
    }
    
    return {
      id: savedValuation.id,
      estimatedMinPrice: minPrice,
      estimatedMaxPrice: maxPrice,
      recommendedPrice: adjustedPrice,
      expiresAt: expiresAt.toISOString(),
      marketAnalysis
    };
  },
  
  /**
   * Obtiene valoraciones previas de un usuario
   * @param userId ID del usuario
   * @returns Lista de valoraciones
   */
  async getUserValuations(userId: string): Promise<VehicleValuationResult[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('valuations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user valuations:', error);
      throw new Error('Error al obtener las valoraciones: ' + error.message);
    }
    
    return data.map(item => ({
      id: item.id,
      estimatedMinPrice: item.estimated_min_price,
      estimatedMaxPrice: item.estimated_max_price,
      recommendedPrice: item.recommended_price,
      expiresAt: item.expires_at,
      marketAnalysis: {
        averagePrice: Math.round(item.recommended_price * 1.05),
        demandLevel: this.calculateDemandLevel(item.brand, item.model, item.year) as 'high' | 'medium' | 'low',
        similarListings: Math.floor(Math.random() * 50) + 10,
        salesTime: Math.floor(Math.random() * 30) + 15
      }
    }));
  },
  
  /**
   * Obtiene una valoración por su ID
   * @param id ID de la valoración
   * @returns Detalles de la valoración
   */
  async getValuationById(id: string): Promise<VehicleValuationResult | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('valuations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching valuation:', error);
      return null;
    }
    
    return {
      id: data.id,
      estimatedMinPrice: data.estimated_min_price,
      estimatedMaxPrice: data.estimated_max_price,
      recommendedPrice: data.recommended_price,
      expiresAt: data.expires_at,
      marketAnalysis: {
        averagePrice: Math.round(data.recommended_price * 1.05),
        demandLevel: this.calculateDemandLevel(data.brand, data.model, data.year) as 'high' | 'medium' | 'low',
        similarListings: Math.floor(Math.random() * 50) + 10,
        salesTime: Math.floor(Math.random() * 30) + 15
      }
    };
  },
  
  // ---- Métodos auxiliares para el cálculo ----
  
  /**
   * Calcula el precio base según marca, modelo y año
   */
  calculateBasePrice(brand: string, model: string, year: number): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    
    // Asignar valor base según la marca (simulación)
    let baseValue = 200000; // Valor predeterminado
    
    const premiumBrands = ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Porsche'];
    const midRangeBrands = ['Toyota', 'Honda', 'Volkswagen', 'Mazda', 'Hyundai', 'Kia'];
    const economyBrands = ['Chevrolet', 'Ford', 'Nissan', 'Renault', 'Fiat'];
    
    if (premiumBrands.includes(brand)) {
      baseValue = 500000;
    } else if (midRangeBrands.includes(brand)) {
      baseValue = 300000;
    } else if (economyBrands.includes(brand)) {
      baseValue = 200000;
    }
    
    // Aplicar depreciación por edad
    const annualDepreciation = age <= 1 ? 0.1 : 0.07; // 10% primer año, 7% siguientes
    const totalDepreciation = Math.min(0.8, annualDepreciation * age); // Máximo 80% de depreciación
    
    return Math.round(baseValue * (1 - totalDepreciation));
  },
  
  /**
   * Ajusta el precio según el kilometraje
   */
  adjustForMileage(price: number, mileage: number, year: number): number {
    const age = new Date().getFullYear() - year;
    const expectedMileage = age * 20000; // 20,000 km por año
    
    if (mileage <= expectedMileage) {
      return price; // Kilometraje normal o bajo
    }
    
    // Penalización por exceso de kilometraje
    const excessMileage = mileage - expectedMileage;
    const mileageFactor = Math.max(0.7, 1 - (excessMileage / expectedMileage) * 0.1);
    
    return Math.round(price * mileageFactor);
  },
  
  /**
   * Ajusta el precio según la condición
   */
  adjustForCondition(price: number, condition: string): number {
    const conditionFactors: Record<string, number> = {
      'excellent': 1.1,
      'good': 1.0,
      'fair': 0.9,
      'poor': 0.75
    };
    
    return Math.round(price * (conditionFactors[condition] || 1.0));
  },
  
  /**
   * Ajusta el precio según extras
   */
  adjustForExtras(price: number, extras: string[]): number {
    // Valor adicional por cada extra
    const extraValue = price * 0.01; // 1% del valor por cada extra
    
    return Math.round(price + extraValue * extras.length);
  },
  
  /**
   * Calcula el nivel de demanda (simulación)
   */
  calculateDemandLevel(brand: string, model: string, year: number): string {
    const age = new Date().getFullYear() - year;
    
    const highDemandBrands = ['Toyota', 'Honda', 'Volkswagen', 'Mazda'];
    
    if (highDemandBrands.includes(brand) && age < 5) {
      return 'high';
    } else if (age < 8) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}; 