
import { createClient } from '@/utils/supabase/server';
import { CarReservation } from '@/types/reservation';

// Tipos para notificaciones
export type NotificationType = 
  | 'reservation_created'      // Se creó una reserva (para vendedor)
  | 'reservation_paid'         // Se completó el pago de una reserva (para vendedor y comprador)
  | 'reservation_expired'      // Una reserva ha expirado (para vendedor y comprador)
  | 'reservation_approaching'  // Una reserva está próxima a expirar (para comprador)
  | 'message_received'         // Se recibió un mensaje (para vendedor o comprador)
  | 'reservation_cancelled'    // Se canceló una reserva (para vendedor y comprador)

// Interfaz para notificaciones en base de datos
/* interface _DbNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  related_id?: string;
  read: boolean;
  created_at: string;
} */

// Interfaz para notificaciones en la aplicación
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

// Servicio de notificaciones
export const NotificationService = {
  /**
   * Envía un email de notificación
   * @param email Correo del destinatario
   * @param subject Asunto del correo
   * @param content Contenido del correo
   * @private Solo para uso interno del servicio
   */
  async _sendEmail(email: string, subject: string, content: string): Promise<void> {
    try {
      // En un entorno real, aquí se integraría con un servicio de email como SendGrid, AWS SES, etc.
      // Para este proyecto, solo simulamos el envío
      console.log(`[EMAIL] To: ${email}, Subject: ${subject}, Content: ${content}`);
      
      // Opcional: Si se quisiera implementar realmente, se podría usar un endpoint serverless
      /*
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, subject, content }),
      });
      
      if (!response.ok) {
        throw new Error('Error sending email');
      }
      */
    } catch (err) {
      console.error('Error sending email:', err);
      // No lanzamos el error para que el flujo continúe aunque falle el email
    }
  },
  
  /**
   * Crea una notificación en app para un usuario
   * @param userId ID del usuario
   * @param type Tipo de notificación
   * @param title Título de la notificación
   * @param message Mensaje de la notificación
   * @param link Enlace opcional al que redirigir
   * @param relatedId ID opcional relacionado (ej: ID de reserva)
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    relatedId?: string
  ): Promise<string> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        userId: userId,
        type,
        title,
        message,
        link,
        relatedId: relatedId,
        read: false
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating notification:', error);
      throw new Error('Error al crear notificación: ' + error.message);
    }
    
    return data.id;
  },
  
  /**
   * Obtiene notificaciones no leídas para un usuario
   * @param userId ID del usuario
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', userId)
      .eq('read', false)
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching unread notifications:', error);
      throw new Error('Error al obtener notificaciones: ' + error.message);
    }
    
    // Mapear a la interfaz de la aplicación
    return (data || []).map(notif => ({
      id: notif.id,
      userId: notif.userId,
      type: notif.type as NotificationType,
      title: notif.title,
      message: notif.message,
      link: notif.link,
      relatedId: notif.relatedId,
      read: notif.read,
      createdAt: notif.createdAt
    }));
  },
  
  /**
   * Obtiene todas las notificaciones de un usuario
   * @param userId ID del usuario
   * @param limit Límite de notificaciones a obtener
   */
  async getAllNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching all notifications:', error);
      throw new Error('Error al obtener notificaciones: ' + error.message);
    }
    
    // Mapear a la interfaz de la aplicación
    return (data || []).map(notif => ({
      id: notif.id,
      userId: notif.userId,
      type: notif.type as NotificationType,
      title: notif.title,
      message: notif.message,
      link: notif.link,
      relatedId: notif.relatedId,
      read: notif.read,
      createdAt: notif.createdAt
    }));
  },
  
  /**
   * Marca una notificación como leída
   * @param notificationId ID de la notificación
   */
  async markAsRead(notificationId: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Error al marcar notificación como leída: ' + error.message);
    }
  },
  
  /**
   * Marca todas las notificaciones de un usuario como leídas
   * @param userId ID del usuario
   */
  async markAllAsRead(userId: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('userId', userId)
      .eq('read', false);
    
    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Error al marcar notificaciones como leídas: ' + error.message);
    }
  },
  
  /**
   * Cuenta notificaciones no leídas para un usuario
   * @param userId ID del usuario
   */
  async countUnread(userId: string): Promise<number> {
    const supabase = await createClient();
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('read', false);
    
    if (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
    
    return count || 0;
  },
  
  /**
   * Notifica sobre una reserva creada pero pendiente de pago
   * @param reservation Datos de la reserva
   * @param sellerId ID del vendedor
   * @param sellerEmail Email del vendedor
   * @param buyerEmail Email del comprador
   * @param carTitle Título del vehículo
   */
  async notifyReservationCreated(
    reservation: CarReservation,
    sellerId: string,
    sellerEmail: string,
    buyerEmail: string,
    carTitle: string
  ): Promise<void> {
    // 1. Notificar al vendedor por email
    const sellerSubject = 'Nuevo intento de reserva para tu vehículo';
    const sellerContent = `
      Hola,
      
      Un usuario ha iniciado el proceso de reserva para tu vehículo "${carTitle}".
      La reserva está pendiente de pago. Te notificaremos cuando se complete el pago.
      
      Saludos,
      El equipo de Car Marketplace
    `;
    
    await this._sendEmail(sellerEmail, sellerSubject, sellerContent);
    
    // 2. Crear notificación en app para el vendedor
    await this.createNotification(
      sellerId,
      'reservation_created',
      'Nuevo intento de reserva',
      `Un usuario ha iniciado el proceso de reserva para tu vehículo "${carTitle}".`,
      `/cars/${reservation.listingId}`,
      reservation.id
    );
    
    // 3. Notificar al comprador por email
    const buyerSubject = 'Tu reserva está pendiente de pago';
    const buyerContent = `
      Hola,
      
      Has iniciado el proceso de reserva para el vehículo "${carTitle}".
      Por favor, completa el pago para asegurar tu reserva.
      
      Saludos,
      El equipo de Car Marketplace
    `;
    
    await this._sendEmail(buyerEmail, buyerSubject, buyerContent);
  },
  
  /**
   * Notifica sobre una reserva pagada y confirmada
   * @param reservation Datos de la reserva
   * @param sellerId ID del vendedor
   * @param sellerEmail Email del vendedor
   * @param buyerEmail Email del comprador
   * @param carTitle Título del vehículo
   * @param expiryDate Fecha de expiración de la reserva
   */
  async notifyReservationPaid(
    reservation: CarReservation,
    sellerId: string,
    sellerEmail: string,
    buyerEmail: string,
    carTitle: string,
    expiryDate: string
  ): Promise<void> {
    // Formatear fecha
    const date = new Date(expiryDate);
    const formattedDate = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // 1. Notificar al vendedor por email
    const sellerSubject = 'Reserva confirmada para tu vehículo';
    const sellerContent = `
      Hola,
      
      La reserva para tu vehículo "${carTitle}" ha sido confirmada.
      El vehículo está reservado hasta el ${formattedDate}.
      Te recomendamos contactar al comprador para coordinar una visita.
      
      Saludos,
      El equipo de Car Marketplace
    `;
    
    await this._sendEmail(sellerEmail, sellerSubject, sellerContent);
    
    // 2. Crear notificación en app para el vendedor
    await this.createNotification(
      sellerId,
      'reservation_paid',
      'Reserva confirmada',
      `La reserva para tu vehículo "${carTitle}" ha sido confirmada hasta el ${formattedDate}.`,
      `/cars/${reservation.listingId}`,
      reservation.id
    );
    
    // 3. Notificar al comprador por email
    const buyerSubject = 'Tu reserva ha sido confirmada';
    const buyerContent = `
      Hola,
      
      ¡Felicidades! Tu reserva para el vehículo "${carTitle}" ha sido confirmada.
      La reserva es válida hasta el ${formattedDate}.
      Te recomendamos contactar al vendedor para coordinar una visita.
      
      Saludos,
      El equipo de Car Marketplace
    `;
    
    await this._sendEmail(buyerEmail, buyerSubject, buyerContent);
    
    // 4. Crear notificación en app para el comprador
    await this.createNotification(
      reservation.userId,
      'reservation_paid',
      'Reserva confirmada',
      `Tu reserva para el vehículo "${carTitle}" ha sido confirmada hasta el ${formattedDate}.`,
      `/cars/${reservation.listingId}`,
      reservation.id
    );
  },
  
  /**
   * Notifica sobre una reserva próxima a expirar
   * @param reservation Datos de la reserva
   * @param buyerEmail Email del comprador
   * @param carTitle Título del vehículo
   * @param expiryDate Fecha de expiración de la reserva
   */
  async notifyReservationApproaching(
    reservation: CarReservation,
    buyerEmail: string,
    carTitle: string,
    expiryDate: string
  ): Promise<void> {
    // Formatear fecha
    const date = new Date(expiryDate);
    const formattedDate = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // 1. Notificar al comprador por email
    const buyerSubject = 'Tu reserva está próxima a expirar';
    const buyerContent = `
      Hola,
      
      Tu reserva para el vehículo "${carTitle}" expirará el ${formattedDate}.
      Si estás interesado en el vehículo, te recomendamos contactar al vendedor lo antes posible.
      
      Saludos,
      El equipo de Car Marketplace
    `;
    
    await this._sendEmail(buyerEmail, buyerSubject, buyerContent);
    
    // 2. Crear notificación en app para el comprador
    await this.createNotification(
      reservation.userId,
      'reservation_approaching',
      'Reserva próxima a expirar',
      `Tu reserva para el vehículo "${carTitle}" expirará el ${formattedDate}.`,
      `/cars/${reservation.listingId}`,
      reservation.id
    );
  },
  
  /**
   * Notifica sobre una reserva expirada
   * @param reservation Datos de la reserva
   * @param sellerId ID del vendedor
   * @param sellerEmail Email del vendedor
   * @param buyerEmail Email del comprador
   * @param carTitle Título del vehículo
   */
  async notifyReservationExpired(
    reservation: CarReservation,
    sellerId: string,
    sellerEmail: string,
    buyerEmail: string,
    carTitle: string
  ): Promise<void> {
    // 1. Notificar al vendedor por email
    const sellerSubject = 'La reserva para tu vehículo ha expirado';
    const sellerContent = `
      Hola,
      
      La reserva para tu vehículo "${carTitle}" ha expirado.
      Tu vehículo vuelve a estar disponible para otros compradores.
      
      Saludos,
      El equipo de Car Marketplace
    `;
    
    await this._sendEmail(sellerEmail, sellerSubject, sellerContent);
    
    // 2. Crear notificación en app para el vendedor
    await this.createNotification(
      sellerId,
      'reservation_expired',
      'Reserva expirada',
      `La reserva para tu vehículo "${carTitle}" ha expirado. Está disponible nuevamente.`,
      `/cars/${reservation.listingId}`,
      reservation.id
    );
    
    // 3. Notificar al comprador por email
    const buyerSubject = 'Tu reserva ha expirado';
    const buyerContent = `
      Hola,
      
      Tu reserva para el vehículo "${carTitle}" ha expirado.
      Si todavía estás interesado, puedes intentar reservarlo nuevamente.
      
      Saludos,
      El equipo de Car Marketplace
    `;
    
    await this._sendEmail(buyerEmail, buyerSubject, buyerContent);
    
    // 4. Crear notificación en app para el comprador
    await this.createNotification(
      reservation.userId,
      'reservation_expired',
      'Reserva expirada',
      `Tu reserva para el vehículo "${carTitle}" ha expirado.`,
      `/cars/${reservation.listingId}`,
      reservation.id
    );
  },
  
  /**
   * Notifica sobre una reserva cancelada o pago rechazado
   * @param reservation Datos de la reserva
   * @param sellerId ID del vendedor
   * @param sellerEmail Email del vendedor
   * @param buyerEmail Email del comprador
   * @param carTitle Título del vehículo
   * @param reason Razón opcional de la cancelación
   */
  async notifyReservationCancelled(
    reservation: CarReservation,
    sellerId: string,
    sellerEmail: string,
    buyerEmail: string,
    carTitle: string,
    reason?: string
  ): Promise<void> {
    const reasonText = reason ? ` Razón: ${reason}.` : '';
    
    // 1. Notificar al vendedor por email
    const sellerSubject = 'Reserva cancelada para tu vehículo';
    const sellerContent = `
      Hola,
      
      La reserva para tu vehículo "${carTitle}" ha sido cancelada.${reasonText}
      Tu vehículo vuelve a estar disponible para otros compradores.
      
      Saludos,
      El equipo de Car Marketplace
    `;
    
    await this._sendEmail(sellerEmail, sellerSubject, sellerContent);
    
    // 2. Crear notificación en app para el vendedor
    await this.createNotification(
      sellerId,
      'reservation_cancelled',
      'Reserva cancelada',
      `La reserva para tu vehículo "${carTitle}" ha sido cancelada.${reasonText} Está disponible nuevamente.`,
      `/cars/${reservation.listingId}`,
      reservation.id
    );
    
    // 3. Notificar al comprador por email
    const buyerSubject = 'Tu reserva ha sido cancelada';
    const buyerContent = `
      Hola,
      
      Tu reserva para el vehículo "${carTitle}" ha sido cancelada.${reasonText}
      Si todavía estás interesado, puedes intentar reservarlo nuevamente.
      
      Saludos,
      El equipo de Car Marketplace
    `;
    
    await this._sendEmail(buyerEmail, buyerSubject, buyerContent);
    
    // 4. Crear notificación en app para el comprador
    await this.createNotification(
      reservation.userId,
      'reservation_cancelled',
      'Reserva cancelada',
      `Tu reserva para el vehículo "${carTitle}" ha sido cancelada.${reasonText}`,
      `/cars/${reservation.listingId}`,
      reservation.id
    );
  }
}; 