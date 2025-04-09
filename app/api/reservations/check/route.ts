import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ReservationService } from "@/services/reservation";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Obtener ID del listado desde los parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const listingId = searchParams.get('listingId');
    
    if (!listingId) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }
    
    // Verificar si el listado está reservado
    const isReserved = await ReservationService.isListingReserved(listingId);
    
    // Si está reservado, obtener detalles de la reserva
    let reservationDetails = null;
    
    if (isReserved) {
      const reservation = await ReservationService.getActiveReservationForListing(listingId);
      
      // Solo devolver detalles de la reserva si el usuario es el comprador o vendedor
      if (reservation) {
        // Verificar si el usuario es el comprador
        const isBuyer = reservation.userId === user.id;
        
        // Verificar si el usuario es el vendedor
        const { data: listing } = await supabase
          .from('listings')
          .select('seller_id')
          .eq('id', listingId)
          .single();
        
        const isSeller = listing && listing.seller_id === user.id;
        
        if (isBuyer || isSeller) {
          reservationDetails = {
            id: reservation.id,
            expiresAt: reservation.expiresAt,
            createdAt: reservation.createdAt,
            isCurrentUserBuyer: isBuyer
          };
        }
      }
    }
    
    return NextResponse.json({
      isReserved,
      reservationDetails
    });
  } catch (error) {
    console.error("Error checking reservation:", error);
    return NextResponse.json({ error: "Failed to check reservation" }, { status: 500 });
  }
} 

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { methodSelected, sentParams  } = await request.json();

    if (methodSelected === 'getUserReservationsWithCarDetails') {
      const reservations = await ReservationService.getUserReservationsWithCarDetails(sentParams.userId);
      return NextResponse.json(reservations);
    }

    if (methodSelected === 'updateReservationPaymentStatus') {
      const reservation=  await ReservationService.updateReservationPaymentStatus(sentParams.paymentId, sentParams.preferenceId);
      return NextResponse.json({ reservation });
    }

    return NextResponse.json({ message: "Reservation checked successfully" });
  } catch (error) {
    console.error("Error checking reservation:", error);
    return NextResponse.json({ error: "Failed to check reservation" }, { status: 500 });
  }
}

