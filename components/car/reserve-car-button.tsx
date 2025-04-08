"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldAlert } from "lucide-react"
import { formatCurrency } from "@/utils/format"
import { toast } from "sonner"
import axios from "axios"
import { createClient } from "@/utils/supabase/client"

interface ReserveCarButtonProps {
  carId: string
  price: number
  title: string
  disabled?: boolean
}

/* interface ReservationData {
  notes?: string;
}

interface ReservationResponse {
  id: string;
  checkoutUrl: string;
} */

export default function ReserveCarButton({ carId, price, title, disabled = false }: ReserveCarButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isReserved, setIsReserved] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [_isDialogOpen, setIsDialogOpen] = useState(false)

  // Calcular el monto de la reserva (1% del precio)
  const reservationAmount = price * 0.01

  // Verificar si el auto ya está reservado
  useEffect(() => {
    const checkReservationStatus = async () => {
      try {
        setIsCheckingStatus(true)
        const response = await fetch(`/api/reservations/check?listingId=${carId}`)
        
        if (response.ok) {
          const data = await response.json()
          setIsReserved(data.isReserved)
        }
      } catch (error) {
        console.error("Error checking reservation status:", error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    checkReservationStatus()
  }, [carId])

  const handleReserve = async () => {
    
    const supabase = createClient()
    const { error } = await supabase.auth.getUser()
    if (error) {
      console.error("Error getting user:", error)
      toast.error("Inicia sesión para reservar")
      return
    }
    setIsLoading(true)
    try {
      // Simulación de la función createReservation
      /* const response: ReservationResponse = {
        id: "res_" + Math.random().toString(36).substr(2, 9),
        checkoutUrl: `/checkout?listing=${carId}`
      } */
      const response = await axios.post('/api/reservations/create', {
        listingId: carId
      });
      
      setIsLoading(false)
      setIsDialogOpen(false)
      
      //const reservationId = response.data.reservationId
      
      // Redirigir al usuario a la página de pago
      window.location.href = response.data.initPoint
    } catch (error) {
      console.error("Error creating reservation:", error)
      toast.error("No se pudo procesar la reserva")
    } finally {
      setIsLoading(false)
    }

  }

  if (isCheckingStatus) {
    return (
      <Button disabled size="lg" className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Verificando disponibilidad...
      </Button>
    )
  }

  if (isReserved) {
    return (
      <Button disabled variant="secondary" size="lg" className="w-full">
        <ShieldAlert className="mr-2 h-4 w-4" />
        Vehículo reservado
      </Button>
    )
  }

  return (
    <Button 
      onClick={handleReserve} 
      disabled={disabled || isLoading} 
      size="lg" 
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          Reservar con {formatCurrency(reservationAmount)}
        </>
      )}
    </Button>
  )
} 