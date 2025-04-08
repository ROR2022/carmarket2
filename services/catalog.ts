import { createClient } from '@/utils/supabase/server';
import { Car, CarFilters, CarListResponse, PaginationInfo, SortOption } from '@/types/car';
import { CarCategory, FuelType, Transmission } from '@/types/car';
import { CarListing, ListingStatus } from '@/types/listing';

// Mapear de CarListing (DB) a Car (UI pública)
function mapListingToCar(listing: CarListing): Car {
  return {
    id: listing.id,
    title: listing.title,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    category: listing.category as CarCategory,
    price: listing.price,
    mileage: listing.mileage,
    fuelType: listing.fuelType as FuelType,
    transmission: listing.transmission as Transmission,
    features: listing.features,
    description: listing.description,
    location: listing.location,
    images: listing.images,
    sellerId: listing.sellerId,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt
  };
}

// Servicio de catálogo para búsqueda pública de anuncios
export const CatalogService = {
  // Buscar anuncios con filtros, paginación y ordenamiento
  async searchListings(
    filters: CarFilters = {},
    page: number = 1,
    pageSize: number = 12,
    sort: SortOption = 'created_desc'
  ): Promise<CarListResponse> {
    const supabase = await createClient();
    const offset = (page - 1) * pageSize;
    
    // Construir la consulta base para anuncios activos y aprobados
    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' })
      .in('status', ['active', 'approved']);
    
    // Aplicar filtros de precio
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }
    
    // Filtros de año
    if (filters.minYear !== undefined) {
      query = query.gte('year', filters.minYear);
    }
    if (filters.maxYear !== undefined) {
      query = query.lte('year', filters.maxYear);
    }
    
    // Filtros de marca
    if (filters.brands && filters.brands.length > 0) {
      query = query.in('brand', filters.brands);
    }
    
    // Filtros de modelo
    if (filters.models && filters.models.length > 0) {
      const searchTerms = filters.models.map(model => `%${model}%`);
      // Usar OR para buscar cualquier coincidencia de modelo
      let modelCondition = '';
      searchTerms.forEach((term, index) => {
        if (index > 0) modelCondition += ',';
        modelCondition += `model.ilike.${term}`;
      });
      query = query.or(modelCondition);
    }
    
    // Filtros de categoría
    if (filters.categories && filters.categories.length > 0) {
      query = query.in('category', filters.categories);
    }
    
    // Filtros de transmisión
    if (filters.transmissions && filters.transmissions.length > 0) {
      query = query.in('transmission', filters.transmissions);
    }
    
    // Filtros de tipo de combustible
    if (filters.fuelTypes && filters.fuelTypes.length > 0) {
      query = query.in('fuel_type', filters.fuelTypes);
    }
    
    // Filtro de kilometraje
    if (filters.minMileage !== undefined) {
      query = query.gte('mileage', filters.minMileage);
    }
    if (filters.maxMileage !== undefined) {
      query = query.lte('mileage', filters.maxMileage);
    }
    
    // Filtro por término de búsqueda
    if (filters.searchTerm) {
      query = query.or(
        `title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%,brand.ilike.%${filters.searchTerm}%,model.ilike.%${filters.searchTerm}%`
      );
    }
    
    // Aplicar ordenamiento
    switch (sort) {
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'year_desc':
        query = query.order('year', { ascending: false });
        break;
      case 'year_asc':
        query = query.order('year', { ascending: true });
        break;
      case 'mileage_desc':
        query = query.order('mileage', { ascending: false });
        break;
      case 'mileage_asc':
        query = query.order('mileage', { ascending: true });
        break;
      case 'created_asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'created_desc':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }
    
    // Aplicar paginación
    query = query.range(offset, offset + pageSize - 1);
    
    // Ejecutar la consulta
    const { data: listings, error, count } = await query;
    
    if (error) {
      console.error('Error fetching listings:', error);
      throw new Error('Error al obtener los anuncios: ' + error.message);
    }
    
    // Obtener IDs de los anuncios para buscar imágenes
    const listingIds = listings.map(listing => listing.id);
    
    // Obtener imágenes para estos anuncios
    const { data: images, error: imagesError } = await supabase
      .from('listing_images')
      .select('listing_id, url')
      .in('listing_id', listingIds)
      .order('display_order', { ascending: true });
    
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
    }
    
    // Mapear resultados al modelo Car para UI pública
    const cars: Car[] = listings.map(listing => {
      const carListing: CarListing = {
        id: listing.id,
        title: listing.title,
        brand: listing.brand,
        model: listing.model,
        year: listing.year,
        category: listing.category,
        price: listing.price,
        mileage: listing.mileage,
        fuelType: listing.fuel_type,
        transmission: listing.transmission,
        features: listing.features || [],
        description: listing.description,
        location: listing.location,
        images: imagesByListingId[listing.id] || [],
        sellerId: listing.seller_id,
        sellerName: listing.seller_name,
        sellerEmail: listing.seller_email,
        sellerPhone: listing.seller_phone || '',
        status: listing.status as ListingStatus,
        viewCount: listing.view_count,
        contactCount: listing.contact_count,
        isFeatured: listing.is_featured,
        createdAt: listing.created_at,
        updatedAt: listing.updated_at,
        expiresAt: listing.expires_at || '',
      };
      
      return mapListingToCar(carListing);
    });
    
    // Preparar información de paginación
    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    const pagination: PaginationInfo = {
      currentPage: page,
      totalPages,
      totalItems,
      pageSize,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
    
    return {
      cars,
      pagination
    };
  },
  
  // Obtener anuncios destacados
  async getFeaturedListings(limit: number = 6): Promise<Car[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .in('status', ['active', 'approved'])
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching featured listings:', error);
      throw new Error('Error al obtener anuncios destacados: ' + error.message);
    }
    
    // Obtener IDs de los anuncios para buscar imágenes
    const listingIds = data.map(listing => listing.id);
    
    // Obtener imágenes para estos anuncios
    const { data: images, error: imagesError } = await supabase
      .from('listing_images')
      .select('listing_id, url')
      .in('listing_id', listingIds)
      .order('display_order', { ascending: true });
    
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
    }
    
    // Mapear resultados al modelo Car para UI pública
    return data.map(listing => {
      const carListing: CarListing = {
        id: listing.id,
        title: listing.title,
        brand: listing.brand,
        model: listing.model,
        year: listing.year,
        category: listing.category,
        price: listing.price,
        mileage: listing.mileage,
        fuelType: listing.fuel_type,
        transmission: listing.transmission,
        features: listing.features || [],
        description: listing.description,
        location: listing.location,
        images: imagesByListingId[listing.id] || [],
        sellerId: listing.seller_id,
        sellerName: listing.seller_name,
        sellerEmail: listing.seller_email,
        sellerPhone: listing.seller_phone || '',
        status: listing.status as ListingStatus,
        viewCount: listing.view_count,
        contactCount: listing.contact_count,
        isFeatured: listing.is_featured,
        createdAt: listing.created_at,
        updatedAt: listing.updated_at,
        expiresAt: listing.expires_at || '',
      };
      
      return mapListingToCar(carListing);
    });
  },
  
  // Obtener marcas disponibles para filtros
  async getAvailableBrands(): Promise<string[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('listings')
      .select('brand')
      .in('status', ['active', 'approved'])
      .order('brand')
      .not('brand', 'is', null);
    
    if (error) {
      console.error('Error fetching available brands:', error);
      throw new Error('Error al obtener marcas disponibles: ' + error.message);
    }
    
    // Extraer marcas únicas
    const uniqueBrands = new Set<string>();
    data.forEach(item => {
      if (item.brand) {
        uniqueBrands.add(item.brand);
      }
    });
    
    return Array.from(uniqueBrands);
  },
  
  // Incrementar contador de vistas para un anuncio
  async incrementViewCount(id: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase.rpc('increment_listing_view_count', { listing_id: id });
    
    if (error) {
      console.error('Error incrementing view count:', error);
    }
  },
  
  // Incrementar contador de contactos para un anuncio
  async incrementContactCount(id: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase.rpc('increment_listing_contact_count', { listing_id: id });
    
    if (error) {
      console.error('Error incrementing contact count:', error);
    }
  },
  
  // Obtener detalle de un anuncio específico
  async getListingById(id: string): Promise<Car | null> {
    const supabase = await createClient();
    
    // Obtener el anuncio
    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .in('status', ['active', 'approved'])
      .single();
    
    if (error) {
      console.error('Error fetching listing details:', error);
      return null;
    }
    
    if (!listing) {
      return null;
    }
    
    // Obtener las imágenes relacionadas
    const { data: images, error: imagesError } = await supabase
      .from('listing_images')
      .select('url')
      .eq('listing_id', id)
      .order('display_order', { ascending: true });
    
    if (imagesError) {
      console.error('Error fetching listing images:', imagesError);
    }
    
    // Incrementar contador de vistas
    this.incrementViewCount(id).catch(err => 
      console.error('Error incrementing view count:', err)
    );
    
    // Mapear a modelo Car
    const carListing: CarListing = {
      id: listing.id,
      title: listing.title,
      brand: listing.brand,
      model: listing.model,
      year: listing.year,
      category: listing.category,
      price: listing.price,
      mileage: listing.mileage,
      fuelType: listing.fuel_type,
      transmission: listing.transmission,
      features: listing.features || [],
      description: listing.description,
      location: listing.location,
      images: images ? images.map(img => img.url) : [],
      sellerId: listing.seller_id,
      sellerName: listing.seller_name,
      sellerEmail: listing.seller_email,
      sellerPhone: listing.seller_phone || '',
      status: listing.status,
      viewCount: listing.view_count,
      contactCount: listing.contact_count,
      isFeatured: listing.is_featured,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      expiresAt: listing.expires_at || '',
    };
    
    return mapListingToCar(carListing);
  }
}; 