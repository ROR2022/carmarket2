import { createClient } from '@/utils/supabase/server';
import { CarListing, ListingStatus as _ListingStatus } from '@/types/listing';
import { CarReservation as _CarReservation, PaymentStatus as _PaymentStatus, ReservationStatus as _ReservationStatus } from '@/types/reservation';

// Initialize supabase client for RPC calls


// Tipos para estadísticas de vendedor
export interface SellerStats {
  totalListings: number;
  activeListings: number;
  reservedListings: number;
  soldListings: number;
  totalViews: number;
  totalContacts: number;
  totalReservations: number;
  conversionRate: number; // Porcentaje de vistas que resultaron en contactos
  reservationRate: number; // Porcentaje de contactos que resultaron en reservas
  averageViewsPerListing: number;
}

// Tipos para estadísticas de un listado específico
export interface ListingStats {
  viewCount: number;
  contactCount: number;
  reservationCount: number;
  viewsHistory: {
    date: string;
    count: number;
  }[];
  contactsHistory: {
    date: string;
    count: number;
  }[];
  reservationsHistory: {
    date: string;
    count: number;
  }[];
}

// Tipos para estadísticas de comprador
export interface BuyerStats {
  totalReservations: number;
  activeReservations: number;
  expiredReservations: number;
  completedReservations: number;
  totalSpent: number;
  viewedListings: number;
  contactedSellers: number;
}

// Tipos para filtrar por período
export type TimePeriod = 'week' | 'month' | 'year' | 'all';

// Tipos para el servicio de analíticas
export interface PerformanceMetrics {
  averageViewsToContact: number; // Vistas promedio necesarias para un contacto
  averageContactsToReservation: number; // Contactos promedio necesarios para una reserva
  listingCompletionScore: number; // Qué tan completas están las descripciones (0-100)
  photoQualityScore: number; // Calidad de fotos estimada (0-100)
  responseTimeAverage: number; // Tiempo promedio de respuesta en horas
}

export interface ListingAnalyticsData {
  views: number;
  contacts: number;
  daysActive: number;
  viewsTrend: number; // % cambio respecto al período anterior
  contactRate: number; // % de vistas que resultan en contactos
  dailyViews: Array<{ date: string; views: number }>;
  performanceData: Array<{ name: string; Performance: number }>;
  sources: Array<{ source: string; value: number }>;
}

interface ListingPerformance {
  topPerformers: CarListing[];
  lowPerformers: CarListing[];
  performanceMetrics: PerformanceMetrics;
}

// Add interface for viewsHistory item
interface ViewHistoryItem {
  date: string;
  views: number;
}

interface CountHistoryItem {
  date: string;
  count: number;
}

// Servicio de Analítica
export const AnalyticsService = {
  /**
   * Obtiene estadísticas generales para un vendedor
   * @param sellerId ID del vendedor
   * @param period Período de tiempo para las estadísticas
   */
  async getSellerStats(sellerId: string, period: TimePeriod = 'all'): Promise<SellerStats> {
    const supabase = await createClient();
    
    // Crear la fecha de inicio según el período
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      // Si es 'all', usar una fecha muy antigua
      startDate.setFullYear(2000);
    }
    
    const startDateStr = startDate.toISOString();
    
    // 1. Obtener listados del vendedor
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, status, view_count, contact_count, created_at')
      .eq('seller_id', sellerId)
      .gte('created_at', startDateStr);
    
    if (listingsError) {
      console.error('Error fetching seller listings:', listingsError);
      throw new Error('Error al obtener estadísticas del vendedor');
    }
    
    // 2. Calcular totales por estado
    const totalListings = listings?.length || 0;
    const activeListings = listings?.filter(l => l.status === 'active' || l.status === 'approved').length || 0;
    const reservedListings = listings?.filter(l => l.status === 'reserved').length || 0;
    const soldListings = listings?.filter(l => l.status === 'sold').length || 0;
    
    // 3. Calcular vistas y contactos totales
    const totalViews = listings?.reduce((sum, item) => sum + (item.view_count || 0), 0) || 0;
    const totalContacts = listings?.reduce((sum, item) => sum + (item.contact_count || 0), 0) || 0;
    
    // 4. Obtener reservas para estos listados
    const listingIds = listings?.map(l => l.id) || [];
    const { data: reservations, error: reservationsError } = await supabase
      .from('car_reservations')
      .select('id, listing_id, payment_status, created_at')
      .in('listing_id', listingIds.length > 0 ? listingIds : ['no-listings'])
      .gte('created_at', startDateStr);
    
    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError);
      throw new Error('Error al obtener estadísticas de reservas');
    }
    
    const totalReservations = reservations?.length || 0;
    
    // 5. Calcular tasas de conversión
    const conversionRate = totalViews > 0 ? (totalContacts / totalViews) * 100 : 0;
    const reservationRate = totalContacts > 0 ? (totalReservations / totalContacts) * 100 : 0;
    const averageViewsPerListing = totalListings > 0 ? totalViews / totalListings : 0;
    
    return {
      totalListings,
      activeListings,
      reservedListings,
      soldListings,
      totalViews,
      totalContacts,
      totalReservations,
      conversionRate,
      reservationRate,
      averageViewsPerListing
    };
  },
  
  /**
   * Obtiene estadísticas detalladas para un listado específico
   * @param listingId ID del listado
   */
  async getListingStats(listingId: string): Promise<ListingStats> {
    const supabase = await createClient();
    
    // 1. Obtener estadísticas básicas del listado
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('view_count, contact_count')
      .eq('id', listingId)
      .single();
    
    if (listingError) {
      console.error('Error fetching listing stats:', listingError);
      throw new Error('Error al obtener estadísticas del listado');
    }
    
    // 2. Obtener historial de vistas (desde tabla de log si existe)
    const { data: viewsLog, error: viewsError } = await supabase
      .from('listing_views_log')
      .select('created_at')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true });
    
    if (viewsError) {
      console.error('Error fetching views log:', viewsError);
      // No lanzar error, continuamos con datos parciales
    }
    
    // 3. Obtener historial de contactos
    const { data: contactsLog, error: contactsError } = await supabase
      .from('messages')
      .select('created_at')
      .eq('listing_id', listingId)
      .is('parent_message_id', null) // Solo mensajes iniciales, no respuestas
      .order('created_at', { ascending: true });
    
    if (contactsError) {
      console.error('Error fetching contacts log:', contactsError);
      // No lanzar error, continuamos con datos parciales
    }
    
    // 4. Obtener reservas para este listado
    const { data: reservations, error: reservationsError } = await supabase
      .from('car_reservations')
      .select('created_at, payment_status')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true });
    
    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError);
      // No lanzar error, continuamos con datos parciales
    }
    
    // 5. Agrupar datos por día para los historiales
    const viewsHistory = this._groupByDate(viewsLog || []).map(item => ({
      date: item.date,
      count: item.count
    }));
    const contactsHistory = this._groupByDate(contactsLog || []);
    const reservationsHistory = this._groupByDate(reservations || []);
    
    return {
      viewCount: listing?.view_count || 0,
      contactCount: listing?.contact_count || 0,
      reservationCount: reservations?.length || 0,
      viewsHistory,
      contactsHistory,
      reservationsHistory
    };
  },
  
  /**
   * Obtiene estadísticas para un comprador
   * @param buyerId ID del comprador
   * @param period Período de tiempo para las estadísticas
   */
  async getBuyerStats(buyerId: string, period: TimePeriod = 'all'): Promise<BuyerStats> {
    const supabase = await createClient();
    
    // Crear la fecha de inicio según el período
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      // Si es 'all', usar una fecha muy antigua
      startDate.setFullYear(2000);
    }
    
    const startDateStr = startDate.toISOString();
    const _now = new Date().toISOString();
    
    // 1. Obtener reservas del comprador
    const { data: reservations, error: reservationsError } = await supabase
      .from('car_reservations')
      .select('id, listing_id, payment_status, reservation_amount, expires_at, created_at')
      .eq('user_id', buyerId)
      .gte('created_at', startDateStr);
    
    if (reservationsError) {
      console.error('Error fetching buyer reservations:', reservationsError);
      throw new Error('Error al obtener estadísticas del comprador');
    }
    
    const totalReservations = reservations?.length || 0;
    const activeReservations = reservations?.filter(r => 
      r.payment_status === 'approved' && new Date(r.expires_at) > new Date()
    ).length || 0;
    const expiredReservations = reservations?.filter(r => 
      r.payment_status === 'approved' && new Date(r.expires_at) <= new Date()
    ).length || 0;
    const completedReservations = reservations?.filter(r => 
      r.payment_status === 'approved'
    ).length || 0;
    
    // Calcular gasto total en reservas
    const totalSpent = reservations?.reduce((sum, item) => sum + (item.reservation_amount || 0), 0) || 0;
    
    // 2. Obtener vehículos vistos (si se rastrea en una tabla de logs)
    const { count: viewedListings, error: viewsError } = await supabase
      .from('listing_views_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', buyerId)
      .gte('created_at', startDateStr);
    
    if (viewsError) {
      console.error('Error fetching viewed listings:', viewsError);
      // No lanzar error, continuamos con datos parciales
    }
    
    // 3. Obtener vendedores contactados
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('seller_id')
      .eq('sender_id', buyerId)
      .is('parent_message_id', null) // Solo mensajes iniciales, no respuestas
      .gte('created_at', startDateStr);
    
    if (messagesError) {
      console.error('Error fetching contacted sellers:', messagesError);
      // No lanzar error, continuamos con datos parciales
    }
    
    // Contar vendedores únicos contactados
    const uniqueSellers = new Set(messages?.map(m => m.seller_id) || []);
    const contactedSellers = uniqueSellers.size;
    
    return {
      totalReservations,
      activeReservations,
      expiredReservations,
      completedReservations,
      totalSpent,
      viewedListings: viewedListings || 0,
      contactedSellers
    };
  },
  
  /**
   * Obtiene métricas de rendimiento para publicaciones
   * @param sellerId ID del vendedor
   */
  async getListingsPerformance(sellerId: string): Promise<ListingPerformance> {
    try {
      const supabase = await createClient();
      
      // 1. Obtener todos los listados del vendedor
      const { data: listings, error: listingError } = await supabase
        .from('listings')
        .select('id, make, model, year, price, status, view_count, contact_count, created_at, updated_at, images')
        .eq('seller_id', sellerId);
      
      if (listingError || !listings || listings.length === 0) {
        console.error('Error fetching seller listings for performance:', listingError);
        return {
          topPerformers: [],
          lowPerformers: [],
          performanceMetrics: this.getDefaultPerformanceMetrics()
        };
      }
      
      // Convertir a tipo CarListing - limitar a grupos más pequeños para evitar operaciones grandes
      let carListings: CarListing[] = [];
      
      // Procesar en lotes más pequeños (procesamos 25 a la vez)
      for (let i = 0; i < listings.length; i += 25) {
        const batchListings = listings.slice(i, i + 25);
        
        const batchCarListings = batchListings.map((listing: Record<string, unknown>) => {
          // Cast to unknown first and then to CarListing to avoid TypeScript error
          return {
            id: listing.id as string,
            title: `${listing.make as string} ${listing.model as string} ${listing.year as number}`,
            description: '',
            price: listing.price as number,
            images: listing.images as string[],
            location: '',
            userId: sellerId,
            status: listing.status as string,
            make: listing.make as string,
            model: listing.model as string,
            year: listing.year as number,
            brand: listing.make as string, // Assuming brand is the same as make
            category: 'unknown', // Default value for required fields
            mileage: 0, // Default value
            fuelType: 'unknown', // Default value
            viewCount: listing.view_count as number,
            contactCount: listing.contact_count as number,
            createdAt: listing.created_at as string,
            updatedAt: listing.updated_at as string
          } as unknown as CarListing;
        });
        
        carListings = [...carListings, ...batchCarListings];
      }
      
      // Obtener métricas de rendimiento
      const performanceMetrics = await this.calculatePerformanceMetrics(sellerId);
      
      // Calcular las puntuaciones una vez y almacenarlas para evitar cálculos repetidos
      const listingsWithScores = carListings.map(listing => ({
        listing,
        score: this.calculateListingScore(listing)
      }));
      
      // Ordenar por puntuación (de mayor a menor)
      const sortedByScore = [...listingsWithScores].sort((a, b) => b.score - a.score);
      
      // Obtener top 5 y bottom 5 (o menos si no hay suficientes)
      const topPerformers = sortedByScore.slice(0, Math.min(5, sortedByScore.length))
        .map(item => item.listing);
        
      const bottomPerformers = [...sortedByScore]
        .sort((a, b) => a.score - b.score)
        .slice(0, Math.min(5, sortedByScore.length))
        .map(item => item.listing);
      
      return {
        topPerformers,
        lowPerformers: bottomPerformers,
        performanceMetrics
      };
    } catch (error) {
      console.error('Error fetching listing performance:', error);
      return {
        topPerformers: [],
        lowPerformers: [],
        performanceMetrics: this.getDefaultPerformanceMetrics()
      };
    }
  },
  
  /**
   * Exporta los datos de reservas como CSV o JSON
   * @param sellerId ID del vendedor
   * @param format Formato de exportación ('csv' o 'json')
   * @param period Período de tiempo para las estadísticas
   */
  async exportReservationsData(
    sellerId: string, 
    format: 'csv' | 'json' = 'csv',
    period: TimePeriod = 'all'
  ): Promise<string> {
    const supabase = await createClient();
    
    // Crear la fecha de inicio según el período
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      // Si es 'all', usar una fecha muy antigua
      startDate.setFullYear(2000);
    }
    
    const startDateStr = startDate.toISOString();
    
    // 1. Obtener listados del vendedor
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title')
      .eq('seller_id', sellerId);
    
    if (listingsError) {
      console.error('Error fetching seller listings for export:', listingsError);
      throw new Error('Error al exportar datos de reservas');
    }
    
    if (!listings || listings.length === 0) {
      // Si no hay listados, devolver un CSV o JSON vacío
      return format === 'csv' 
        ? 'ID Reserva,ID Listado,Título Vehículo,ID Comprador,Monto,Estado Pago,Fecha Expiración,Fecha Creación\n'
        : '[]';
    }
    
    // 2. Obtener reservas para estos listados
    const listingIds = listings.map(l => l.id);
    const listingMap = new Map(listings.map(l => [l.id, l.title]));
    
    // Procesar en lotes para evitar errores de "Invalid array length"
    let allReservations: any[] = [];
    
    // Procesar listingIds en lotes de 20
    for (let i = 0; i < listingIds.length; i += 20) {
      const batchIds = listingIds.slice(i, i + 20);
      
      const { data: batchReservations, error: reservationsError } = await supabase
        .from('car_reservations')
        .select('id, listing_id, user_id, reservation_amount, payment_status, expires_at, created_at')
        .in('listing_id', batchIds)
        .gte('created_at', startDateStr);
      
      if (reservationsError) {
        console.error('Error fetching reservations batch for export:', reservationsError);
        throw new Error('Error al exportar datos de reservas');
      }
      
      if (batchReservations && batchReservations.length > 0) {
        allReservations = [...allReservations, ...batchReservations];
      }
    }
    
    // Usar allReservations en lugar de reservations
    if (allReservations.length === 0) {
      // Si no hay reservas, devolver un CSV o JSON vacío
      return format === 'csv' 
        ? 'ID Reserva,ID Listado,Título Vehículo,ID Comprador,Monto,Estado Pago,Fecha Expiración,Fecha Creación\n'
        : '[]';
    }
    
    // 3. Formatear los datos según el formato requerido
    if (format === 'csv') {
      // Crear encabezados CSV
      let csv = 'ID Reserva,ID Listado,Título Vehículo,ID Comprador,Monto,Estado Pago,Fecha Expiración,Fecha Creación\n';
      
      // Agregar filas
      allReservations.forEach(r => {
        const vehicleTitle = listingMap.get(r.listing_id) || 'Desconocido';
        const row = [
          r.id,
          r.listing_id,
          `"${vehicleTitle.replace(/"/g, '""')}"`, // Escapar comillas en CSV
          r.user_id,
          r.reservation_amount,
          r.payment_status,
          r.expires_at,
          r.created_at
        ].join(',');
        
        csv += row + '\n';
      });
      
      return csv;
    } else {
      // Formato JSON
      const jsonData = allReservations.map(r => ({
        id: r.id,
        listingId: r.listing_id,
        vehicleTitle: listingMap.get(r.listing_id) || 'Desconocido',
        buyerId: r.user_id,
        amount: r.reservation_amount,
        paymentStatus: r.payment_status,
        expiresAt: r.expires_at,
        createdAt: r.created_at
      }));
      
      return JSON.stringify(jsonData, null, 2);
    }
  },
  
  /**
   * Método privado para agrupar datos por fecha
   * @param data Array de objetos con propiedad created_at
   */
  _groupByDate<T extends { created_at?: string }>(data: T[]): CountHistoryItem[] {
    const dateMap = new Map<string, number>();
    
    data.forEach((item: Record<string, unknown>) => {
      // Extraer solo la fecha (sin hora)
      const date = new Date(item.created_at as string).toISOString().split('T')[0];
      
      if (dateMap.has(date)) {
        dateMap.set(date, dateMap.get(date)! + 1);
      } else {
        dateMap.set(date, 1);
      }
    });
    
    // Convertir el mapa a array ordenado por fecha
    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // Funciones auxiliares

  // Obtener rango de fechas para un período específico
  getDateRangeForPeriod(period: TimePeriod): { startDate: string; endDate: string } {
    const endDate = new Date().toISOString();
    let startDate: string;
    
    switch (period) {
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString();
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString();
        break;
      case 'year':
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        startDate = yearAgo.toISOString();
        break;
      case 'all':
      default:
        startDate = '1970-01-01T00:00:00.000Z'; // Fecha muy antigua para incluir todo
        break;
    }
    
    return { startDate, endDate };
  },

  // Calcular puntuación de rendimiento para una publicación
  calculateListingScore(listing: CarListing): number {
    // Fórmula simple: vistas + (contactos * 5)
    // Se puede hacer más sofisticada según necesidades
    return (listing.viewCount || 0) + ((listing.contactCount || 0) * 5);
  },

  // Calcular métricas de rendimiento para un vendedor
  async calculatePerformanceMetrics(sellerId: string): Promise<PerformanceMetrics> {
    try {
      const supabase = await createClient();
      // Obtener datos para calcular métricas desde la base de datos
      const { data, error } = await supabase.rpc('get_seller_performance_metrics', {
        p_seller_id: sellerId
      });
      
      if (error) throw error;
      
      if (data) {
        return {
          averageViewsToContact: data.avg_views_to_contact || 0,
          averageContactsToReservation: data.avg_contacts_to_reservation || 0,
          listingCompletionScore: data.listing_completion_score || 0,
          photoQualityScore: data.photo_quality_score || 0,
          responseTimeAverage: data.response_time_avg || 0
        };
      }
      
      return this.getDefaultPerformanceMetrics();
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return this.getDefaultPerformanceMetrics();
    }
  },

  // Valores por defecto para métricas de rendimiento
  getDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      averageViewsToContact: 0,
      averageContactsToReservation: 0,
      listingCompletionScore: 0,
      photoQualityScore: 0,
      responseTimeAverage: 0
    };
  },

  /**
   * Obtiene datos analíticos para una publicación específica
   */
  async getListingAnalytics(listingId: string, period: TimePeriod = 'month'): Promise<ListingAnalyticsData> {
    try {
      const supabase = await createClient();
      // Determinar rango de fechas según el período seleccionado
      const dateRange = this.getDateRangeForPeriod(period);
      const previousDateRange = this.getPreviousPeriodRange(period);
      
      // Obtener datos básicos de la publicación
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();
      
      if (listingError) throw listingError;
      
      // Obtener vistas en el período actual
      const { data: viewsData, error: viewsError } = await supabase
        .from('listing_views_log')
        .select('created_at')
        .eq('listing_id', listingId)
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate);
      
      if (viewsError) throw viewsError;
      
      // Obtener vistas en el período anterior para calcular tendencia
      const { data: previousViewsData, error: prevViewsError } = await supabase
        .from('listing_views_log')
        .select('created_at')
        .eq('listing_id', listingId)
        .gte('created_at', previousDateRange.startDate)
        .lte('created_at', previousDateRange.endDate);
      
      if (prevViewsError) throw prevViewsError;
      
      // Obtener mensajes relacionados con la publicación
      const { data: contactsData, error: contactsError } = await supabase
        .from('messages')
        .select('created_at')
        .eq('listing_id', listingId)
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate);
      
      if (contactsError) throw contactsError;
      
      // Calcular días activos
      const createdAt = new Date(listing.created_at);
      const today = new Date();
      const daysActive = Math.ceil((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calcular tendencia de vistas (% de cambio)
      const currentViews = viewsData?.length || 0;
      const previousViews = previousViewsData?.length || 0;
      const viewsTrend = previousViews > 0 
        ? ((currentViews - previousViews) / previousViews) * 100 
        : 0;
      
      // Calcular tasa de contacto
      const contacts = contactsData?.length || 0;
      const contactRate = currentViews > 0 ? (contacts / currentViews) * 100 : 0;
      
      // Agrupar vistas por día para el gráfico
      const dailyViews = this._groupByDate(viewsData || []).map(item => ({
        date: item.date,
        views: item.count
      })) as ViewHistoryItem[];
      
      // Obtener datos de rendimiento comparativo
      const performanceData = await this.getPerformanceComparisonData(listingId);
      
      // Obtener fuentes de tráfico
      const sources = await this.getTrafficSourcesData(listingId);
      
      return {
        views: currentViews,
        contacts,
        daysActive,
        viewsTrend,
        contactRate,
        dailyViews,
        performanceData,
        sources
      };
    } catch (error) {
      console.error('Error fetching listing analytics:', error);
      return {
        views: 0,
        contacts: 0,
        daysActive: 0,
        viewsTrend: 0,
        contactRate: 0,
        dailyViews: [],
        performanceData: [],
        sources: []
      };
    }
  },

  /**
   * Obtiene tendencias de actividad para un vendedor en un período
   */
  async getActivityTrends(sellerId: string, period: TimePeriod = 'month'): Promise<unknown[]> {
    try {
      const supabase = await createClient();
      // Determinar rango de fechas según el período seleccionado
      const dateRange = this.getDateRangeForPeriod(period);
      
      // Obtener tendencias de actividad usando una RPC
      const { data, error } = await supabase.rpc('get_seller_activity_trends', {
        p_seller_id: sellerId,
        p_start_date: dateRange.startDate,
        p_end_date: dateRange.endDate
      });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching activity trends:', error);
      return [];
    }
  },

  /**
   * Genera recomendaciones para mejorar el rendimiento de las publicaciones
   */
  async generateListingRecommendations(listingId: string): Promise<string[]> {
    try {
      const supabase = await createClient();
      // Obtener detalles de la publicación
      const { data: listing, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();
      
      if (error) throw error;
      
      // Si no hay publicación, devolver mensaje por defecto
      if (!listing) {
        return ['No se encontró la publicación solicitada'];
      }
      
      // Lógica para generar recomendaciones basadas en datos de la publicación
      const recommendations: string[] = [];
      
      // Verificar título
      if (!listing.title || listing.title.length < 20) {
        recommendations.push('Mejora el título con más detalles, incluyendo marca, modelo y características destacadas');
      }
      
      // Verificar descripción
      if (!listing.description || listing.description.length < 100) {
        recommendations.push('Agrega una descripción más detallada que incluya el estado del vehículo, características especiales y historial de mantenimiento');
      }
      
      // Verificar imágenes
      if (!listing.images || listing.images.length < 5) {
        recommendations.push('Agrega más fotos desde diferentes ángulos, incluyendo interior, exterior, motor y detalles importantes');
      }
      
      // Verificar precio
      if (!listing.price) {
        recommendations.push('Establece un precio competitivo basado en vehículos similares en el mercado');
      }
      
      // Si no hay recomendaciones, agregar mensaje positivo
      if (recommendations.length === 0) {
        recommendations.push('¡Tu publicación está bien optimizada! Continúa monitoreando su rendimiento');
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error generating listing recommendations:', error);
      return ['Error al generar recomendaciones para la publicación'];
    }
  },

  // Obtener rango de fechas para el período anterior
  getPreviousPeriodRange(period: TimePeriod): { startDate: string; endDate: string } {
    const currentRange = this.getDateRangeForPeriod(period);
    const currentStartDate = new Date(currentRange.startDate);
    const currentEndDate = new Date(currentRange.endDate);
    const duration = currentEndDate.getTime() - currentStartDate.getTime();
    
    const previousEndDate = new Date(currentStartDate);
    previousEndDate.setMilliseconds(previousEndDate.getMilliseconds() - 1);
    
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setTime(previousStartDate.getTime() - duration);
    
    return {
      startDate: previousStartDate.toISOString(),
      endDate: previousEndDate.toISOString()
    };
  },

  // Obtener datos de rendimiento comparativo
  async getPerformanceComparisonData(listingId: string): Promise<Array<{ name: string; Performance: number }>> {
    try {
      const supabase = await createClient();
      // Obtener datos de la publicación
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('make, model, year, view_count, contact_count, user_id')
        .eq('id', listingId)
        .single();
      
      if (listingError) throw listingError;
      
      // Obtener promedio de publicaciones similares
      const { data: similarListings, error: similarError } = await supabase
        .from('listings')
        .select('view_count, contact_count')
        .eq('make', listing.make)
        .eq('model', listing.model)
        .neq('id', listingId);
      
      if (similarError) throw similarError;
      
      // Calcular rendimiento de la publicación actual
      const currentScore = (listing.view_count || 0) + ((listing.contact_count || 0) * 5);
      
      // Calcular promedio de publicaciones similares
      let avgScore = 0;
      if (similarListings && similarListings.length > 0) {
        const totalScore = similarListings.reduce((sum: number, item: Record<string, unknown>) => {
          return sum + (item.view_count as number || 0) + ((item.contact_count as number || 0) * 5);
        }, 0);
        avgScore = totalScore / similarListings.length;
      }
      
      // Convertir a escala porcentual (0-100)
      const maxPossibleScore = 250; // Valor arbitrario para escalar
      const currentPerformance = Math.min(100, (currentScore / maxPossibleScore) * 100);
      const avgPerformance = Math.min(100, (avgScore / maxPossibleScore) * 100);
      
      return [
        { name: 'Esta publicación', Performance: Math.round(currentPerformance) },
        { name: 'Promedio similar', Performance: Math.round(avgPerformance) }
      ];
    } catch (error) {
      console.error('Error getting performance comparison data:', error);
      return [
        { name: 'Esta publicación', Performance: 75 },
        { name: 'Promedio similar', Performance: 60 }
      ];
    }
  },

  // Obtener fuentes de tráfico
  async getTrafficSourcesData(listingId: string): Promise<Array<{ source: string; value: number }>> {
    try {
      const supabase = await createClient();
      // Obtener datos de las fuentes de tráfico
      const { data, error } = await supabase
        .from('listing_views_log')
        .select('referrer')
        .eq('listing_id', listingId);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return this.getDefaultTrafficSources();
      }
      
      // Clasificar y contar fuentes
      const sourcesMap = new Map<string, number>();
      let total = 0;
      
      data.forEach((item: Record<string, unknown>) => {
        const source = this.classifyReferrer(item.referrer as string || 'direct');
        const count = sourcesMap.get(source) || 0;
        sourcesMap.set(source, count + 1);
        total++;
      });
      
      // Convertir a porcentajes
      const sources = Array.from(sourcesMap.entries()).map(([source, count]) => ({
        source,
        value: Math.round((count / total) * 100)
      }));
      
      // Ordenar por valor descendente
      return sources.sort((a, b) => b.value - a.value);
    } catch (error) {
      console.error('Error getting traffic sources data:', error);
      return [];
    }
  },

  // Obtener fuentes de tráfico
  getDefaultTrafficSources(): Array<{ source: string; value: number }> {
    return [
      { source: 'Directo', value: 50 },
      { source: 'Redes Sociales', value: 30 },
      { source: 'Búsqueda Orgánica', value: 20 },
      { source: 'Referencias', value: 10 },
      { source: 'Otros', value: 10 }
    ];
  },

  // Clasificar fuente de tráfico
  classifyReferrer(referrer: string): string {
    const knownSources = ['Google', 'Facebook', 'Twitter', 'Instagram', 'LinkedIn'];
    const lowerReferrer = referrer.toLowerCase();
    
    if (knownSources.some(source => lowerReferrer.includes(source.toLowerCase()))) {
      return referrer;
    } else {
      return 'Otros';
    }
  }
}; 