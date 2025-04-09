import { MercadoPagoConfig, Payment, Preference } from "mercadopago"
import { calculateReservationAmount } from "@/utils/reservation"

// Initialize the MercadoPago client
const mp_access_token = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
if (!mp_access_token) {
  throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not set");
}
//console.warn("mp_access_token", mp_access_token);
const mercadopago = new MercadoPagoConfig({
  accessToken: mp_access_token,
})

// Definir interfaz para los items
interface PaymentItem {
  id: string;
  title: string;
  price: number;
  [key: string]: unknown;
}

export async function createPaymentPreference(items: PaymentItem[], buyerEmail: string) {
  try {
    const preference = new Preference(mercadopago)

    const result = await preference.create({
      body: {
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          quantity: 1,
          unit_price: item.price,
          currency_id: "MXN",
        })),
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/reservation/success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/reservation/failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/reservation/pending`,
        },
        auto_return: "approved",
        payer: {
          email: buyerEmail,
        },
      },
    })

    return result
  } catch (error) {
    console.error("Error creating payment preference:", error)
    throw error
  }
}

export async function getPaymentById(paymentId: string) {
  try {
    const payment = new Payment(mercadopago)
    return await payment.get({ id: paymentId })
  } catch (error) {
    console.error("Error getting payment:", error)
    throw error
  }
}

/**
 * Crear una preferencia de pago para reservar un vehículo (1% del precio)
 * 
 * @param listingId ID del listado a reservar
 * @param listingTitle Título del listado
 * @param price Precio del vehículo
 * @param buyerEmail Email del comprador
 * @returns Preferencia de pago de Mercado Pago
 */
export async function createReservationPaymentPreference(
  listingId: string, 
  listingTitle: string, 
  price: number, 
  buyerEmail: string
) {
  // Calcular el monto de la reserva (1% del precio)
  const reservationAmount = calculateReservationAmount(price);
  //test_user_1184956246@testuser.com
  try {
    const preference = new Preference(mercadopago);
    
    const result = await preference.create({
      body: {
        items: [{
          id: `reservation-${listingId}`,
          title: `Reserva: ${listingTitle}`,
          quantity: 1,
          unit_price: reservationAmount,
          currency_id: "MXN",
        }],
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/reservation/success?listing=${listingId}`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/reservation/failure?listing=${listingId}`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/reservation/pending?listing=${listingId}`,
        },
        auto_return: "approved",
        payer: {
          email: "test_user_1184956246@testuser.com",
        },
        metadata: {
          listing_id: listingId,
          type: 'reservation',
          amount: reservationAmount
        }
      },
    });
    
    return result;
  } catch (error) {
    console.error("Error creating reservation payment preference:", error);
    throw error;
  }
}

