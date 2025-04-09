/**
 * Utilidades para la funcionalidad de reservas de vehículos
 */

/**
 * Calcula el monto de reserva (1% del precio del vehículo)
 * 
 * @param price Precio del vehículo en MXN
 * @returns Monto de reserva en MXN
 */
export function calculateReservationAmount(price: number): number {
  // Calcular el 1% del precio
  const amount = price * 0.01;
  
  // Redondear a 2 decimales
  return Math.round(amount * 100) / 100;
}

/**
 * Comprueba si una reserva está vencida
 * 
 * @param expiresAt Fecha de expiración de la reserva
 * @returns true si la reserva está vencida, false en caso contrario
 */
export function isReservationExpired(expiresAt: string): boolean {
  const now = new Date();
  const expiration = new Date(expiresAt);
  
  return now > expiration;
}

/**
 * Calcula el tiempo restante de una reserva en horas
 * 
 * @param expiresAt Fecha de expiración de la reserva
 * @returns Número de horas restantes (0 si ya expiró)
 */
export function getRemainingHours(expiresAt: string): number {
  const now = new Date();
  const expiration = new Date(expiresAt);
  
  // Si ya expiró, devolver 0
  if (now > expiration) return 0;
  
  // Calcular diferencia en horas
  const diffMs = expiration.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  return diffHours;
} 