"use client"

import { useEffect, useState } from 'react'
import { formatDistance } from 'date-fns'
import { es } from 'date-fns/locale'
import { ShieldCheck, Clock, AlertCircle, CheckCircle, Hourglass } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReservationService } from "@/services/reservation"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { ReservationStatus as ReservationStatusType } from "@/types/reservation"

interface ReservationStatusProps {
  carId: string
  /** Solo mostrar si el usuario es el comprador o vendedor */
  onlyIfUserInvolved?: boolean
}

interface ReservationDetails {
  status: ReservationStatusType
  id: string
  expiresAt: string
  paymentId?: string
  createdAt: string
  userId: string
  buyerName?: string
  buyerEmail?: string
  isCurrentUserBuyer?: boolean
}

export default function ReservationStatus({ 
  carId, 
  onlyIfUserInvolved = true 
}: ReservationStatusProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReserved, setIsReserved] = useState(false)
  const [reservationDetails, setReservationDetails] = useState<ReservationDetails | null>(null)
  const [_showContact, _setShowContact] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkReservationStatus = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/reservations/check?listingId=${carId}`)
        if (!response.ok) {
          throw new Error('Error al verificar el estado de la reserva')
        }
        
        const data = await response.json()
        setIsReserved(data.isReserved)
        
        // Si hay detalles de la reserva y el usuario está involucrado
        if (data.reservationDetails) {
          setReservationDetails(data.reservationDetails)
        }
      } catch (err) {
        console.error('Error checking reservation:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    
    checkReservationStatus()
  }, [carId])
  
  // Si está cargando o hay un error o no está reservado, no mostrar nada
  if (loading || error || !isReserved) {
    return null
  }
  
  // Si solo debe mostrarse si el usuario está involucrado y no tenemos detalles, no mostrar nada
  if (onlyIfUserInvolved && !reservationDetails) {
    return null
  }
  
  // Para visitantes que no están involucrados, mostrar solo el estado básico
  if (!reservationDetails) {
    return (
      <Card className="mb-4 border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-center text-amber-800">
            <ShieldCheck className="h-5 w-5 mr-2" />
            <p className="font-medium">Este vehículo está actualmente reservado</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Fecha de expiración
  const expiryDate = new Date(reservationDetails.expiresAt)
  const timeUntilExpiry = formatDistance(expiryDate, new Date(), {
    addSuffix: true,
    locale: es
  })
  
  const handleCancelReservation = async () => {
    if (!reservationDetails) return
    
    try {
      await ReservationService.releaseReservation(reservationDetails.id)
      
      toast({
        title: "Reserva cancelada",
        description: "La reserva ha sido cancelada correctamente.",
      })
      
      // Recargar la página para actualizar el estado
      router.refresh()
    } catch (error) {
      console.error("Error cancelling reservation:", error)
      
      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva. Intenta nuevamente.",
        variant: "destructive",
      })
    }
  }
  
  // Para compradores o vendedores, mostrar detalles completos
  return (
    <Card className="mb-4 border-amber-200 bg-amber-50">
      <CardContent className="pt-6">
        <div className="flex items-center text-amber-800 mb-2">
          <ShieldCheck className="h-5 w-5 mr-2" />
          <p className="font-medium">
            {reservationDetails.isCurrentUserBuyer 
              ? 'Has reservado este vehículo' 
              : 'Este vehículo está reservado'}
          </p>
        </div>
        
        <div className="flex items-center text-amber-700 text-sm mb-4">
          <Clock className="h-4 w-4 mr-2" />
          <p>La reserva expira {timeUntilExpiry}</p>
        </div>
        
        <Separator className="my-3 bg-amber-200" />
        
        <Alert variant={reservationDetails?.status === "approved" ? "default" : "destructive"}>
          {reservationDetails?.status === "approved" && (
            <>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Vehículo reservado</AlertTitle>
              <AlertDescription className="flex flex-col">
                <span>
                  Este vehículo está reservado hasta el {new Date(reservationDetails.expiresAt).toLocaleDateString()}.
                </span>
                {reservationDetails.isCurrentUserBuyer && (
                  <span className="text-sm mt-1">
                    Reservado por: {reservationDetails.buyerName} ({reservationDetails.buyerEmail})
                  </span>
                )}
                {(reservationDetails.isCurrentUserBuyer || reservationDetails.userId === "current-user-id") && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-fit" 
                    onClick={handleCancelReservation}
                  >
                    Cancelar reserva
                  </Button>
                )}
              </AlertDescription>
            </>
          )}
          
          {reservationDetails?.status === "approved" && new Date(reservationDetails.expiresAt) < new Date() && (
            <>
              <Hourglass className="h-4 w-4" />
              <AlertTitle>Reserva expirada</AlertTitle>
              <AlertDescription className="flex flex-col">
                <span>
                  La reserva para este vehículo ha expirado el {new Date(reservationDetails.expiresAt).toLocaleDateString()}.
                </span>
                {(reservationDetails.isCurrentUserBuyer || reservationDetails.userId === "current-user-id") && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-fit" 
                    onClick={handleCancelReservation}
                  >
                    Limpiar reserva
                  </Button>
                )}
              </AlertDescription>
            </>
          )}
          
          {reservationDetails.status === "pending" && (
            <>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Pago pendiente</AlertTitle>
              <AlertDescription>
                Hay un pago pendiente para la reserva de este vehículo.
              </AlertDescription>
            </>
          )}
        </Alert>
      </CardContent>
    </Card>
  )
} 