import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createReservationPaymentPreference } from "@/services/mercado-pago";
import { VerificationService } from "@/services/verification";
import { ReservationService } from "@/services/reservation";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User not found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Obtener ID del listado desde el cuerpo de la solicitud
    const { listingId } = await request.json();
    
    if (!listingId) {
      console.error("Listing ID is required");
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }
    
    // Verificar si el usuario puede proceder con la reserva
    const verificationResult = await VerificationService.canProceedWithReservation(
      listingId, 
      user.id
    );
    
    if (!verificationResult.canProceed) {
      console.error("Verification failed:", verificationResult.reason);
      return NextResponse.json({ 
        error: verificationResult.reason || "No se puede proceder con la reserva" 
      }, { status: 400 });
    }
    
    // Obtener detalles del listado
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .single();
    
    if (listingError || !listing) {
      console.error("Listing not found");
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    
    // Crear preferencia de pago
    const preference = await createReservationPaymentPreference(
      listing.id,
      listing.title,
      listing.price,
      user.email as string
    );
    
    console.warn("preference: ", preference);

    // Crear una reserva en estado pendiente
    const reservationAmount = listing.price * 0.01; // 1% del precio
    
    

    const reservationId = await ReservationService.createReservation(
      listing.id,
      user.id,
      reservationAmount,
      preference.id as string // Usando el ID de la preferencia como ID de pago por ahora
    );
    
    return NextResponse.json({
      reservationId,
      preferenceId: preference.id,
      initPoint: preference.init_point,
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 });
  }
} 