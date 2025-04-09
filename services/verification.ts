import { createClient } from '@/utils/supabase/server';
import { ReservationService } from './reservation';
import { ListingService } from './listings';

/**
 * Servicio para realizar verificaciones y validaciones
 */
export const VerificationService = {
  /**
   * Verificar si un usuario puede proceder con una reserva
   * 
   * @param listingId ID del listado a reservar
   * @param userId ID del usuario que intenta reservar
   * @returns Resultado de la verificación
   */
  async canProceedWithReservation(
    listingId: string, 
    userId: string
  ): Promise<{ canProceed: boolean; reason?: string }> {
    if (!listingId || !userId) {
      return { canProceed: false, reason: 'Información incompleta' };
    }
    
    try {
      // 1. Verificar si el usuario puede reservar el listado
      const userCheck = await ListingService.canUserReserve(listingId, userId);
      
      if (!userCheck.canReserve) {
        return { canProceed: false, reason: userCheck.reason };
      }
      
      // 2. Verificar si el usuario tiene reservas activas pendientes de pago
      const supabase = await createClient();
      
      const now = new Date().toISOString();
      
      const { count, error } = await supabase
        .from('car_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('payment_status', 'pending')
        .gt('expires_at', now);
      
      if (error) {
        console.error('Error checking pending reservations:', error);
        return { canProceed: false, reason: 'Error al verificar reservas pendientes' };
      }
      
      const pendingReservations = count || 0;
      
      if (pendingReservations > 3) {
        return { 
          canProceed: false, 
          reason: 'Tienes demasiadas reservas pendientes. Completa o cancela algunas antes de crear una nueva.' 
        };
      }
      
      // 3. Verificar si el usuario ya ha intentado reservar este listado recientemente
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const { count: recentAttempts, error: recentError } = await supabase
        .from('car_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .in('payment_status', ['cancelled', 'rejected'])
        .gt('created_at', oneDayAgo.toISOString());
      
      if (recentError) {
        console.error('Error checking recent attempts:', recentError);
        return { canProceed: false, reason: 'Error al verificar intentos recientes' };
      }
      
      const attempts = recentAttempts || 0;
      
      if (attempts > 2) {
        return { 
          canProceed: false, 
          reason: 'Has intentado reservar este vehículo demasiadas veces recientemente. Inténtalo más tarde.' 
        };
      }
      
      return { canProceed: true };
    } catch (error) {
      console.error('Error in reservation verification:', error);
      return { canProceed: false, reason: 'Error en la verificación' };
    }
  },
  
  /**
   * Verificar el estado de un pago y actualizar la reserva
   * 
   * @param paymentId ID del pago en Mercado Pago
   * @param paymentStatus Estado del pago
   * @param reservationId ID de la reserva
   * @returns Resultado de la verificación
   */
  async verifyPaymentAndUpdateReservation(
    paymentId: string,
    paymentStatus: string,
    reservationId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Mapear estado de pago de Mercado Pago a nuestro modelo
      let status: 'pending' | 'approved' | 'rejected' | 'cancelled';
      
      switch (paymentStatus) {
        case 'approved':
          status = 'approved';
          break;
        case 'rejected':
          status = 'rejected';
          break;
        case 'cancelled':
          status = 'cancelled';
          break;
        default:
          status = 'pending';
      }
      
      // Actualizar estado de la reserva
      await ReservationService.updatePaymentStatus(reservationId, status);
      
      // Si el pago fue aprobado, marcar el listado como reservado
      if (status === 'approved') {
        const reservation = await ReservationService.getReservationById(reservationId);
        
        if (reservation) {
          await ListingService.reserveListing(reservation.listingId);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { success: false, message: 'Error al verificar el pago' };
    }
  }
}; 