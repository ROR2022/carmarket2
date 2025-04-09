import { CarListing, ListingStatus } from '@/types/listing';
import { createClient } from '@/utils/supabase/client';
import { CarCategory, FuelType, Transmission } from '@/types/car';

// Tipo para los elementos de listado en la base de datos
type DbListing = {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  transmission: string;
  fuel_type: string;
  mileage: number;
  color: string;
  vin_number?: string;
  license_plate?: string;
  price: number;
  negotiable: boolean;
  accepts_trade: boolean;
  description: string;
  features: string[];
  location: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  seller_phone?: string;
  status: string;
  view_count: number;
  contact_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  featured_until?: string;
};

// Función auxiliar para mapear un objeto de listado DB a un CarListing
function mapDbListingToCarListing(dbListing: DbListing): CarListing {
  return {
    id: dbListing.id,
    title: dbListing.title,
    brand: dbListing.brand,
    model: dbListing.model,
    year: dbListing.year,
    category: dbListing.category as CarCategory,
    price: dbListing.price,
    mileage: dbListing.mileage,
    fuelType: dbListing.fuel_type as FuelType,
    transmission: dbListing.transmission as Transmission,
    features: dbListing.features,
    description: dbListing.description,
    location: dbListing.location,
    images: [], // Se llenarán en otra consulta
    sellerId: dbListing.seller_id,
    sellerName: dbListing.seller_name,
    sellerEmail: dbListing.seller_email,
    sellerPhone: dbListing.seller_phone || "",
    status: dbListing.status as ListingStatus,
    viewCount: dbListing.view_count,
    contactCount: dbListing.contact_count,
    isFeatured: dbListing.is_featured,
    createdAt: dbListing.created_at,
    updatedAt: dbListing.updated_at,
    expiresAt: dbListing.expires_at || "",
  };
}

// Tipos para estadísticas
export type AdminStats = {
  totalListings: number;
  pendingListings: number;
  approvedListings: number;
  rejectedListings: number;
  changesRequestedListings: number;
  totalUsers: number;
  newListingsToday: number;
};

// Tipo para los parámetros de filtro
export type AdminListingsFilter = {
  status?: ListingStatus;
  fromDate?: Date;
  toDate?: Date;
  searchTerm?: string;
  limit?: number;
  offset?: number;
};

// Resultado paginado
export type PaginatedListings = {
  listings: CarListing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const AdminService = {
  // Verificar si el usuario actual es admin
  async isAdmin(): Promise<boolean> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('is_admin');
      
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data || false;
  },
  
  // Obtener estadísticas para el dashboard
  async getAdminStats(): Promise<AdminStats> {
    const supabase = createClient();
    
    console.log('getAdminStats recuperando estadisticas...');
    // Obtener conteos de anuncios por estado
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: false });

    console.log('listingsData datos recuperados:...', listingsData);
      
    if (listingsError) {
      console.error('Error fetching listings stats:', listingsError);
      throw new Error('Error al obtener estadísticas de anuncios');
    }
    
    // Contar anuncios por estado
    const statuses = listingsData.map(item => item.status);
    const pendingCount = statuses.filter(s => s === 'pending').length;
    const approvedCount = statuses.filter(s => s === 'approved').length;
    const rejectedCount = statuses.filter(s => s === 'rejected').length;
    const changesRequestedCount = statuses.filter(s => s === 'changes_requested').length;
    
    // Obtener conteo de usuarios
    const { count: usersCount, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (usersError) {
      console.error('Error fetching users stats:', usersError);
      throw new Error('Error al obtener estadísticas de usuarios');
    }
    
    // Obtener anuncios creados hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayCount, error: todayError } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
      
    if (todayError) {
      console.error('Error fetching today listings:', todayError);
      throw new Error('Error al obtener anuncios de hoy');
    }
    
    return {
      totalListings: listingsData.length,
      pendingListings: pendingCount,
      approvedListings: approvedCount,
      rejectedListings: rejectedCount,
      changesRequestedListings: changesRequestedCount,
      totalUsers: usersCount || 0,
      newListingsToday: todayCount || 0,
    };
  },
  
  // Obtener anuncios para revisión con filtros y paginación
  async getListingsForReview(filters: AdminListingsFilter = {}): Promise<PaginatedListings> {
    const supabase = createClient();
    const {
      status,
      fromDate,
      toDate,
      searchTerm,
      limit = 10,
      offset = 0
    } = filters;
    
    // Construir la consulta base
    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' });
    
    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }
    
    if (fromDate) {
      query = query.gte('created_at', fromDate.toISOString());
    }
    
    if (toDate) {
      query = query.lte('created_at', toDate.toISOString());
    }
    
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`);
    }
    
    // Aplicar paginación
    query = query.range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    // Ejecutar la consulta
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching listings for review:', error);
      throw new Error('Error al obtener anuncios para revisión');
    }
    
    // Obtener imágenes para estos anuncios
    const listingIds = data.map(listing => listing.id);
    console.log('obteniendo imagenes para los listingIds: ', listingIds);
    const { data: images, error: imagesError } = await supabase
      .from('listing_images')
      .select('listing_id, url')
      .in('listing_id', listingIds);

    console.log('imagenes recuperadas: ', images);
      
    if (imagesError) {
      console.error('Error fetching listing images:', imagesError);
    }
    
    // Agrupar imágenes por listing_id
    const imagesByListingId: Record<string, string[]> = {};
    if (images) {
      images.forEach(img => {
        if (!imagesByListingId[img.listing_id]) {
          imagesByListingId[img.listing_id] = [];
        }
        imagesByListingId[img.listing_id].push(img.url);
      });
      console.log('imagenes agrupadas por listing_id: ', imagesByListingId);
    }
    
    // Mapear resultados al modelo de aplicación
    const listings = data.map(dbListing => {
      const listing = mapDbListingToCarListing(dbListing);
      listing.images = imagesByListingId[listing.id] || [];
      return listing;
    });
    console.log('listings mapeados: ', listings);
    
    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);
    const page = Math.floor(offset / limit) + 1;
    
    return {
      listings,
      total: totalItems,
      page,
      pageSize: limit,
      totalPages
    };
  },
  
  // Aprobar un anuncio
  async approveListing(id: string, adminNotes?: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .rpc('update_listing_status', {
        listing_id: id,
        new_status: 'approved',
        notes: adminNotes
      });
      
    if (error) {
      console.error('Error approving listing:', error);
      throw new Error('Error al aprobar el anuncio: ' + error.message);
    }
  },
  
  // Rechazar un anuncio
  async rejectListing(id: string, adminNotes: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .rpc('update_listing_status', {
        listing_id: id,
        new_status: 'rejected',
        notes: adminNotes
      });
      
    if (error) {
      console.error('Error rejecting listing:', error);
      throw new Error('Error al rechazar el anuncio: ' + error.message);
    }
  },
  
  // Solicitar cambios en un anuncio
  async requestChanges(id: string, adminNotes: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .rpc('update_listing_status', {
        listing_id: id,
        new_status: 'changes_requested',
        notes: adminNotes
      });
      
    if (error) {
      console.error('Error requesting changes:', error);
      throw new Error('Error al solicitar cambios: ' + error.message);
    }
  }
}; 