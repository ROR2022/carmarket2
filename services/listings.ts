import { CarCategory, FuelType, Transmission } from '@/types/car';
import { ListingFormData, ListingStatus, CarListing } from '@/types/listing';
import { createClient } from '@/utils/supabase/server';

// Tipos internos para la base de datos
export type DbListing = {
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
}

// Convertir de DB a modelo de aplicación
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

// Convertir de modelo de aplicación a DB
function mapFormDataToDbListing(formData: ListingFormData, userId: string, status: ListingStatus = 'pending'): Omit<DbListing, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'contact_count'> {
  // Calcular fecha de expiración (30 días desde la creación)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  return {
    title: `${formData.brand} ${formData.model} ${formData.year}`,
    brand: formData.brand,
    model: formData.model,
    year: formData.year,
    category: formData.category,
    transmission: formData.transmission,
    fuel_type: formData.fuelType,
    mileage: formData.mileage,
    color: formData.color,
    vin_number: formData.vinNumber,
    license_plate: formData.licensePlate,
    price: formData.price,
    negotiable: formData.negotiable,
    accepts_trade: formData.acceptsTrade || false,
    description: formData.description,
    features: formData.features,
    location: formData.location,
    seller_id: userId,
    seller_name: formData.sellerName,
    seller_email: formData.sellerEmail,
    seller_phone: formData.sellerPhone,
    status: status,
    is_featured: false,
    expires_at: expiresAt.toISOString(),
  };
}

// Servicio para gestionar anuncios
export const ListingService = {
  // Crear un nuevo anuncio
  async createListing(formData: ListingFormData, userId: string, status: ListingStatus = 'pending'): Promise<string> {
    const supabase = await createClient();
    
    console.log('Insertando anuncio en la base de datos...');
    // Insertar el anuncio en la base de datos
    const { data, error } = await supabase
      .from('listings')
      .insert(mapFormDataToDbListing(formData, userId, status))
      .select('id')
      .single();
    
    console.log('Anuncio insertado en la base de datos: ', data);
    if (error) {
      console.error('Error creating listing:', error);
      throw new Error('Error al crear el anuncio: ' + error.message);
    }
    
    return data.id;
  },
  
  // Guardar un anuncio como borrador
  async saveDraft(formData: ListingFormData, userId: string): Promise<string> {
    return this.createListing(formData, userId, 'draft');
  },
  
  // Obtener un anuncio específico por ID
  async getListingById(id: string): Promise<CarListing | null> {
    const supabase = await createClient();
    
    // Obtener el anuncio
    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching listing:', error);
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
    
    const carListing = mapDbListingToCarListing(listing as DbListing);
    carListing.images = images ? images.map(img => img.url) : [];
    
    return carListing;
  },
  
  // Alias for getListingById for better API consistency
  async getById(id: string): Promise<CarListing | null> {
    return this.getListingById(id);
  },
  
  // Obtener todos los anuncios de un usuario
  async getUserListings(userId: string): Promise<Record<ListingStatus, CarListing[]>> {
    const supabase = await createClient();
    console.log('iniciando getUserListings userId: ', userId);
    // Obtener todos los anuncios del usuario
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', userId);
    
    console.log('data recibida listings: ', listings);
    if (error) {
      console.error('Error fetching user listings:', error);
      throw new Error('Error al obtener los anuncios: ' + error.message);
    }
    
    // Obtener todas las imágenes para estos anuncios
    const listingIds = listings.map(listing => listing.id);
    const { data: allImages, error: imagesError } = await supabase
      .from('listing_images')
      .select('listing_id, url, display_order')
      .in('listing_id', listingIds)
      .order('display_order', { ascending: true });
    
    if (imagesError) {
      console.error('Error fetching listing images:', imagesError);
    }
    
    // Agrupar imágenes por listing_id
    const imagesByListingId: Record<string, string[]> = {};
    if (allImages) {
      allImages.forEach(img => {
        if (!imagesByListingId[img.listing_id]) {
          imagesByListingId[img.listing_id] = [];
        }
        imagesByListingId[img.listing_id].push(img.url);
      });
    }
    
    // Convertir a modelo de aplicación y agrupar por status
    const result: Record<ListingStatus, CarListing[]> = {
      active: [],
      pending: [],
      sold: [],
      expired: [],
      draft: [],
      rejected: [],
      approved: [],
      changes_requested: [],
      reserved: []
    };
    
    listings.forEach(listing => {
      const carListing = mapDbListingToCarListing(listing as DbListing);
      carListing.images = imagesByListingId[listing.id] || [];
      
      const status = listing.status as ListingStatus;
      result[status].push(carListing);
    });
    
    return result;
  },
  
  // Actualizar un anuncio existente
  async updateListing(id: string, formData: Partial<ListingFormData>, userId: string): Promise<void> {
    const supabase = await createClient();
    
    // Primero verificar que el anuncio pertenece al usuario
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !listing) {
      console.error('Error fetching listing for update:', fetchError);
      throw new Error('No se pudo encontrar el anuncio para actualizar');
    }
    
    if (listing.seller_id !== userId) {
      throw new Error('No tienes permiso para actualizar este anuncio');
    }
    
    // Mapear sólo los campos que están en formData
    const updateData: Record<string, unknown> = {};
    if (formData.brand) updateData.brand = formData.brand;
    if (formData.model) updateData.model = formData.model;
    if (formData.year) updateData.year = formData.year;
    if (formData.category) updateData.category = formData.category;
    if (formData.transmission) updateData.transmission = formData.transmission;
    if (formData.fuelType) updateData.fuel_type = formData.fuelType;
    if (formData.mileage) updateData.mileage = formData.mileage;
    if (formData.color) updateData.color = formData.color;
    if (formData.vinNumber !== undefined) updateData.vin_number = formData.vinNumber;
    if (formData.licensePlate !== undefined) updateData.license_plate = formData.licensePlate;
    if (formData.price) updateData.price = formData.price;
    if (formData.negotiable !== undefined) updateData.negotiable = formData.negotiable;
    if (formData.acceptsTrade !== undefined) updateData.accepts_trade = formData.acceptsTrade;
    if (formData.description) updateData.description = formData.description;
    if (formData.features) updateData.features = formData.features;
    if (formData.location) updateData.location = formData.location;
    if (formData.sellerName) updateData.seller_name = formData.sellerName;
    if (formData.sellerEmail) updateData.seller_email = formData.sellerEmail;
    if (formData.sellerPhone !== undefined) updateData.seller_phone = formData.sellerPhone;
    
    // Si hay campos para actualizar, actualizar el anuncio
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();
      
      // Si se actualiza la marca o modelo, actualizar también el título
      if (formData.brand || formData.model || formData.year) {
        const { data: currentData } = await supabase
          .from('listings')
          .select('brand, model, year')
          .eq('id', id)
          .single();
        
        if (currentData) {
          const brand = formData.brand || currentData.brand;
          const model = formData.model || currentData.model;
          const year = formData.year || currentData.year;
          updateData.title = `${brand} ${model} ${year}`;
        }
      }
      
      const { error: updateError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', id);
      
      if (updateError) {
        console.error('Error updating listing:', updateError);
        throw new Error('Error al actualizar el anuncio: ' + updateError.message);
      }
    }
  },
  
  // Cambiar el estado de un anuncio
  async changeListingStatus(id: string, newStatus: ListingStatus, userId: string): Promise<void> {
    const supabase = await createClient();
    
    // Verificar propiedad del anuncio
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !listing) {
      throw new Error('No se pudo encontrar el anuncio');
    }
    
    if (listing.seller_id !== userId) {
      throw new Error('No tienes permiso para modificar este anuncio');
    }
    
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    
    // Si se marca como vendido, registrar la fecha de venta
    if (newStatus === 'sold') {
      updateData.sold_at = new Date().toISOString();
    }
    
    // Si se activa un anuncio expirado, renovar la fecha de expiración
    if (newStatus === 'active') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      updateData.expires_at = expiresAt.toISOString();
    }
    
    const { error: updateError } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id);
    
    if (updateError) {
      console.error('Error changing listing status:', updateError);
      throw new Error('Error al cambiar el estado del anuncio: ' + updateError.message);
    }
  },
  
  // Destacar o quitar destacado de un anuncio
  async toggleFeatured(id: string, isFeatured: boolean, userId: string): Promise<void> {
    const supabase = await createClient();
    
    // Verificar propiedad del anuncio
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('seller_id, status')
      .eq('id', id)
      .single();
    
    if (fetchError || !listing) {
      throw new Error('No se pudo encontrar el anuncio');
    }
    
    if (listing.seller_id !== userId) {
      throw new Error('No tienes permiso para modificar este anuncio');
    }
    
    if (listing.status !== 'active') {
      throw new Error('Solo se pueden destacar anuncios activos');
    }
    
    const updateData: Record<string, unknown> = {
      is_featured: isFeatured,
      updated_at: new Date().toISOString()
    };
    
    // Si se está destacando, establecer la fecha de fin de destacado (7 días)
    if (isFeatured) {
      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + 7);
      updateData.featured_until = featuredUntil.toISOString();
    } else {
      updateData.featured_until = null;
    }
    
    const { error: updateError } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id);
    
    if (updateError) {
      console.error('Error toggling featured status:', updateError);
      throw new Error('Error al cambiar el estado destacado: ' + updateError.message);
    }
  },
  
  // Eliminar un anuncio
  async deleteListing(id: string, userId: string): Promise<void> {
    const supabase = await createClient();
    
    // Verificar propiedad del anuncio
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !listing) {
      throw new Error('No se pudo encontrar el anuncio');
    }
    
    if (listing.seller_id !== userId) {
      throw new Error('No tienes permiso para eliminar este anuncio');
    }
    
    // Eliminar el anuncio (las imágenes y documentos se eliminarán por la restricción ON DELETE CASCADE)
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting listing:', deleteError);
      throw new Error('Error al eliminar el anuncio: ' + deleteError.message);
    }
  },
  
  // Actualizar contador de vistas
  async incrementViewCount(id: string, userId?: string, ipAddress?: string): Promise<void> {
    const supabase = await createClient();
    
    // Intentar usar la función de registro de vistas si está disponible
    try {
      const { error } = await supabase.rpc('log_listing_view', {
        p_listing_id: id,
        p_user_id: userId || null,
        p_ip_address: ipAddress || null,
        p_user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        p_referrer: typeof document !== 'undefined' ? document.referrer : null
      });
      
      if (error) {
        console.error('Error logging view:', error);
      }
    } catch (err) {
      console.error('Error in view tracking:', err);
    }
  },
  
  // Actualizar contador de contactos
  async incrementContactCount(id: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase.rpc('increment_listing_contact_count', { listing_id: id });
    
    if (error) {
      console.error('Error incrementing contact count:', error);
    }
  },
  
  // Marcar un listado como reservado
  async reserveListing(listingId: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('listings')
      .update({ 
        status: 'reserved',
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .in('status', ['active', 'approved']); // Solo permitir reservar listados activos o aprobados
    
    if (error) {
      console.error('Error reserving listing:', error);
      throw new Error(`Error al reservar el listado: ${error.message}`);
    }
  },
  
  // Liberar un listado reservado (volver a estado activo)
  async releaseReservation(listingId: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('listings')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .eq('status', 'reserved');
    
    if (error) {
      console.error('Error releasing reservation:', error);
      throw new Error(`Error al liberar la reserva: ${error.message}`);
    }
  },
  
  // Verificar si un listado puede ser reservado
  async canBeReserved(listingId: string): Promise<{ canReserve: boolean; reason?: string }> {
    const supabase = await createClient();
    
    // Verificar estado actual del listado
    const { data, error } = await supabase
      .from('listings')
      .select('status, seller_id')
      .eq('id', listingId)
      .single();
    
    if (error || !data) {
      return { canReserve: false, reason: 'El vehículo no está disponible' };
    }
    
    // Solo permitir reservar vehículos activos o aprobados
    if (data.status !== 'active' && data.status !== 'approved') {
      return { 
        canReserve: false, 
        reason: `El vehículo no está disponible para reserva (estado: ${data.status})` 
      };
    }
    
    // Verificar si ya existe una reserva activa
    const { count, error: countError } = await supabase
      .from('car_reservations')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId)
      .eq('payment_status', 'approved')
      .gt('expires_at', new Date().toISOString());
    
    if (countError) {
      console.error('Error checking existing reservations:', countError);
      return { canReserve: false, reason: 'Error al verificar reservas existentes' };
    }
    
    if ((count || 0) > 0) {
      return { canReserve: false, reason: 'Este vehículo ya está reservado' };
    }
    
    return { canReserve: true };
  },
  
  // Verificar si un usuario puede reservar un listado específico
  async canUserReserve(listingId: string, userId: string): Promise<{ canReserve: boolean; reason?: string }> {
    const supabase = await createClient();
    
    // Verificar si el usuario es el vendedor
    const { data, error } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', listingId)
      .single();
    
    if (error || !data) {
      return { canReserve: false, reason: 'El vehículo no está disponible' };
    }
    
    if (data.seller_id === userId) {
      return { canReserve: false, reason: 'No puedes reservar tu propio vehículo' };
    }
    
    // Verificar si el listado puede ser reservado
    return this.canBeReserved(listingId);
  }
}; 