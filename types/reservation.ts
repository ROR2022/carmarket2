export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
export type ReservationStatus = 'created' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' | 'error';

export interface CarReservation {
  id: string;
  listingId: string;
  userId: string;
  reservationAmount: number;
  paymentId: string;
  paymentStatus: PaymentStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationWithCar extends CarReservation {
  carTitle?: string;
  carBrand?: string;
  carModel?: string;
  carYear?: number;
  carImage?: string;
  carPrice?: number;
  sellerEmail?: string;
  sellerPhone?: string;
  sellerName?: string;
}

// Interfaz para respuestas de reserva
export interface ReservationResponse {
  id?: string;
  status?: ReservationStatus;
  paymentId?: string;
  checkoutUrl?: string;
  amount?: number;
  createdAt?: string;
  message?: string;
  error?: ReservationError;
}

// Interfaz para errores de reserva
export interface ReservationError {
  message: string;
  code?: string;
  details?: string;
} 