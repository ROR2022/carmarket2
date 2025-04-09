import { createClient } from '@/utils/supabase/server';
import { CarReservation, PaymentStatus, ReservationWithCar } from '@/types/reservation';



interface ListingMedia {
  id: string;
  listing_id: string;
  url: string;
  storage_path: string;
  display_order: number;
  is_primary?: boolean;
  created_at?: Date | string | null;
}

/**
 * Servicio para gestionar las reservas de vehículos
 */
export const ReservationService = {
  /**
   * Crear una nueva reserva en estado pendiente
   *
   * @param listingId ID del listado a reservar
   * @param userId ID del usuario que realiza la reserva
   * @param amount Monto de la reserva (1% del precio)
   * @param paymentId ID de pago en Mercado Pago
   * @returns ID de la nueva reserva
   */
  async createReservation(
    listingId: string,
    userId: string,
    amount: number,
    paymentId: string,
  ): Promise<string> {
    const supabase = await createClient();

    // Calcular fecha de expiración (48 horas desde ahora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const { data, error } = await supabase
      .from('car_reservations')
      .insert({
        listing_id: listingId,
        user_id: userId,
        reservation_amount: amount,
        payment_id: paymentId,
        payment_status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating reservation:', error);
      throw new Error(`Error al crear la reserva: ${error.message}`);
    }

    return data.id;
  },

  /**
   * Obtener una reserva por su ID
   *
   * @param reservationId ID de la reserva a obtener
   * @returns Datos de la reserva o null si no existe
   */
  async getReservationById(reservationId: string): Promise<CarReservation | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('car_reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (error) {
      console.error('Error fetching reservation:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      listingId: data.listing_id,
      userId: data.user_id,
      reservationAmount: data.reservation_amount,
      paymentId: data.payment_id,
      paymentStatus: data.payment_status as PaymentStatus,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Obtener todas las reservas de un usuario
   *
   * @param userId ID del usuario
   * @returns Lista de reservas del usuario
   */
  async getUserReservations(userId: string): Promise<CarReservation[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('car_reservations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user reservations:', error);
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      listingId: item.listing_id,
      userId: item.user_id,
      reservationAmount: item.reservation_amount,
      paymentId: item.payment_id,
      paymentStatus: item.payment_status as PaymentStatus,
      expiresAt: item.expires_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  },

  /**
   * Obtener reservas con detalles del vehículo para un usuario
   *
   * @param userId ID del usuario
   * @returns Lista de reservas con detalles del vehículo
   */
  async getUserReservationsWithCarDetails(userId: string): Promise<ReservationWithCar[]> {
    try {
      const supabase = await createClient();

    

      // Consulta para obtener reservas con joins a listados e imágenes
      const { data, error } = await supabase
        .from('car_reservations')
        .select(`
          *,
          listings!inner(
            id,
            title,
            brand,
            model,
            year,
            price,
            seller_id,
            seller_name,
            seller_email,
            seller_phone,
            listing_images(
              url,
              display_order,
              is_primary
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user reservations with details:', error);
        return [];
      }

      // Transformar los datos al formato deseado
      return data.map((item) => {
        const listing = item.listings || {};
        const image = listing.listing_images && listing.listing_images.length > 0
    ? listing.listing_images.sort((a: ListingMedia, b: ListingMedia) => {
        // Priorizar imagen principal, luego por orden de visualización
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.display_order - b.display_order;
      })[0].url
    : null;

        return {
          id: item.id,
          listingId: item.listing_id,
          userId: item.user_id,
          reservationAmount: item.reservation_amount,
          paymentId: item.payment_id,
          paymentStatus: item.payment_status as PaymentStatus,
          expiresAt: item.expires_at,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          carTitle: listing.title,
          carBrand: listing.brand,
          carModel: listing.model,
          carYear: listing.year,
          carImage: image,
          carPrice: listing.price,
          sellerName: listing.seller_name,
          sellerEmail: listing.seller_email,
          sellerPhone: listing.seller_phone,
        };
      });
    } catch (error) {
      console.error('Error fetching user reservations with details:', error);
      throw new Error(`Error fetching user reservations with details: ${error}`);
    }
  },

  /**
   * Actualizar el estado de pago de una reserva
   *
   * @param reservationId ID de la reserva
   * @param paymentStatus Nuevo estado de pago
   */
  async updatePaymentStatus(reservationId: string, paymentStatus: PaymentStatus): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('car_reservations')
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (error) {
      console.error('Error updating payment status:', error);
      throw new Error(`Error al actualizar el estado de pago: ${error.message}`);
    }
  },

  async updateReservationPaymentStatus(paymentId: string, preferenceId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('car_reservations')
      .update({
        payment_id: paymentId,
        payment_status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_id', preferenceId);
    

    if (error) {
      console.error('Error updating reservation payment status:', error);
      throw new Error(`Error al actualizar el estado de pago de la reserva: ${error.message}`);
    }

    const { data: reservation, error: reservationError } = await supabase
      .from('car_reservations')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    if (reservationError) {
      throw new Error('Reservation not found');
    }

    return reservation;
  },


  /**
   * Verificar si un listado está reservado actualmente
   *
   * @param listingId ID del listado a verificar
   * @returns true si el listado está reservado, false en caso contrario
   */
  async isListingReserved(listingId: string): Promise<boolean> {
    const supabase = await createClient();

    const now = new Date().toISOString();

    // Verificar si hay reservas activas para el listado
    const { count, error } = await supabase
      .from('car_reservations')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId)
      .eq('payment_status', 'approved')
      .gt('expires_at', now);

    if (error) {
      console.error('Error checking reservation status:', error);
      return false;
    }

    return (count || 0) > 0;
  },

  /**
   * Encuentra la reserva activa para un listado, si existe
   *
   * @param listingId ID del listado
   * @returns La reserva activa o null si no hay ninguna
   */
  async getActiveReservationForListing(listingId: string): Promise<CarReservation | null> {
    const supabase = await createClient();

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('car_reservations')
      .select('*')
      .eq('listing_id', listingId)
      .eq('payment_status', 'approved')
      .gt('expires_at', now)
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      listingId: data.listing_id,
      userId: data.user_id,
      reservationAmount: data.reservation_amount,
      paymentId: data.payment_id,
      paymentStatus: data.payment_status as PaymentStatus,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Liberar una reserva (marcarla como expirada)
   *
   * @param reservationId ID de la reserva a liberar
   */
  async releaseReservation(reservationId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('car_reservations')
      .update({
        payment_status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (error) {
      console.error('Error releasing reservation:', error);
      throw new Error(`Error al liberar la reserva: ${error.message}`);
    }
  },
};
