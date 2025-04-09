"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CarListingForm } from "@/components/sell/car-listing-form";
import { ListingFormData } from "@/types/listing";
import { CarCategory, Transmission, FuelType } from "@/types/car";
import { useTranslation } from "@/utils/translation-context";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/utils/auth-hooks";
//import { ListingService } from '@/services/listings';
//import { StorageService } from '@/services/storage';
import { FormRecoveryDialog } from "@/components/sell/form-recovery-dialog";
import { useFormPersistence } from "@/utils/hooks/useFormPersistence";
import axios from "axios";

const FORM_ID = "car-listing-form";
const FORM_VERSION = "1.0";

const GetSearchParams = ({setEditListingId}: {setEditListingId: (editListingId: string) => void}) => {
  const searchParams = useSearchParams();
  const editListingId = searchParams.get("edit");
  useEffect(() => {
    if (editListingId) {
      setEditListingId(editListingId);
    }
  }, [editListingId, setEditListingId]);
  return null;
}


export default function ListingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  //const searchParams = useSearchParams();
  //const editListingId = searchParams.get("edit");
  const [editListingId, setEditListingId] = useState<string | null>(null);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [loadingListing, setLoadingListing] = useState(false);
  const [initialData, setInitialData] = useState<
    Partial<ListingFormData> | undefined
  >(undefined);
  const [pageTitle, setPageTitle] = useState<string>(
    t("sell.listing.pageTitle")
  );
  const [pageSubtitle, setPageSubtitle] = useState<string>(
    t("sell.listing.pageSubtitle")
  );
  const [resetForm, setResetForm] = useState<number>(0); // Contador para forzar el reinicio del formulario

  // Usar nuestro hook personalizado para manejar la persistencia
  const {
    persistedData,
    formMeta,
    showRecoveryDialog,
    setShowRecoveryDialog,
    handleRecoverForm,
    handleDiscardForm,
    calculateProgress,
    saveFormData: savePersistedFormData,
    isInitialized,
  } = useFormPersistence<Partial<ListingFormData>>({
    formId: FORM_ID,
    userId: user?.id,
    formVersion: FORM_VERSION,
    debugMode: true,
  });

  const fetchListingById = useCallback(async (listingId: string) => {
    setLoadingListing(true);
    try {
      const response = await axios.post("/api/listings", {
        methodSelected: "getListingById",
        sentParams: { listingId },
      });
      const listing = response.data;
      if (listing.sellerId !== user?.id) {
        toast.error("No tienes permiso para editar este anuncio");
        router.push("/sell/my-listings");
        return;
      }
      // Preparar datos iniciales para el formulario
      const formData: Partial<ListingFormData> = {
        brand: listing.brand,
        model: listing.model,
        year: listing.year,
        category: listing.category as CarCategory,
        transmission: listing.transmission as Transmission,
        fuelType: listing.fuelType as FuelType,
        mileage: listing.mileage,
        color: "", // No está disponible en el modelo CarListing
        features: listing.features,
        description: listing.description,
        location: listing.location,
        sellerName: listing.sellerName,
        sellerEmail: listing.sellerEmail,
        sellerPhone: listing.sellerPhone,
        price: listing.price,
        negotiable: false, // Valor por defecto, ajustar según necesidad
        acceptsTrade: false, // Valor por defecto, ajustar según necesidad
      };

      setInitialData(formData);
    } catch (error) {
      console.error("Error fetching listing:", error);
      toast.error("Error al cargar el anuncio");
      router.push("/sell/my-listings");
    } finally {
      setLoadingListing(false);
    }
  }, [user, router]);

  // Cargar datos del anuncio si estamos editando
  useEffect(() => {
    if (editListingId && user && isAuthenticated) {
      setPageTitle(t("sell.listing.editTitle"));
      setPageSubtitle(t("sell.listing.editSubtitle"));

      fetchListingById(editListingId);
    }
  }, [editListingId, user, isAuthenticated, router, t, fetchListingById]);

  // Manejar envío del formulario (crear o actualizar)
  const handleSubmit = async (data: ListingFormData) => {
    if (!user) {
      toast.error("Debes iniciar sesión para publicar un anuncio");
      return;
    }

    try {
      setIsSubmitting(true);

      if (editListingId) {
        // Actualizar anuncio existente
        //await ListingService.updateListing(editListingId, data, user.id);

        // Gestionar imágenes si hay nuevas
        if (data.images && data.images.length > 0) {
          /* const uploadedImages = await StorageService.uploadListingImages(
            data.images as File[], 
            user.id, 
            editListingId
          ); */
          //vamos a mandar via axios el formData
          const formData = new FormData();
          if (data.images && data.images.length > 0) {
            (data.images as File[]).forEach((file: File) => {
              formData.append("images", file);
            });
          } else {
            formData.append("images", "");
          }
          formData.append("userId", user.id);
          formData.append("listingId", editListingId);
          formData.append("methodSelected", "uploadListingImages");
          
          const response = await axios.post("/api/storage/formdata", formData);
          const uploadedImages = response.data;

          //await StorageService.saveListingImages(editListingId, uploadedImages);
          await axios.post("/api/storage", {
            methodSelected: "saveListingImages",
            sentParams: {
              editListingId,
              uploadedImages,
            },
          });
        }

        // Gestionar documentos si hay nuevos
        if (data.documents && data.documents.length > 0) {
          /* const uploadedDocuments = await StorageService.uploadListingDocuments(
            data.documents as File[],
            user.id,
            editListingId
          ); */
          //vamos a mandar via axios el formData
          const formData = new FormData();
          if (data.documents && data.documents.length > 0) {
            (data.documents as File[]).forEach((file: File) => {
              formData.append("documents", file);
            });
          } else {
            formData.append("documents", "");
          }
          formData.append("userId", user.id);
          formData.append("listingId", editListingId);
          formData.append("methodSelected", "uploadListingDocuments");
          const response = await axios.post("/api/storage/formdata", formData);
          const uploadedDocuments = response.data;

          /* await StorageService.saveListingDocuments(
            editListingId,
            uploadedDocuments
          ); */
          await axios.post("/api/storage", {
            methodSelected: "saveListingDocuments",
            sentParams: {
              editListingId,
              uploadedDocuments,
            },
          });
        }

        toast.success("Anuncio actualizado con éxito");
      } else {
        // Crear nuevo anuncio
        console.log("creando anuncio con data: ", data);
        //const listingId = await ListingService.createListing(data, user.id);
        const response = await axios.post("/api/listings", {
          methodSelected: "createListing",
          sentParams: { formData: data },
        });
        const listingId = response.data;
        console.log("1.-listingId creado: ", listingId);

        // Subir imágenes
        if (data.images && data.images.length > 0) {
          /* const uploadedImages = await StorageService.uploadListingImages(
            data.images as File[],
            user.id,
            listingId
          ); */
          const formData = new FormData();
          (data.images as File[]).forEach((file: File) => {
            formData.append("images", file);
          }
          );
          formData.append("userId", user.id);
          formData.append("listingId", listingId);
          formData.append("methodSelected", "uploadListingImages");
          const response = await axios.post("/api/storage/formdata", formData);
          const uploadedImages = response.data;
          console.log("2.-uploadedImages subidas: ", uploadedImages);

          //await StorageService.saveListingImages(listingId, uploadedImages);
          await axios.post("/api/storage", {
            methodSelected: "saveListingImages",
            sentParams: {
              editLinstingId: listingId,
              uploadedImages,
            },
          });
          console.log("3.-saveListingImages guardadas: ", listingId);
        }

        // Subir documentos
        if (data.documents && data.documents.length > 0) {
          /* const uploadedDocuments = await StorageService.uploadListingDocuments(
            data.documents as File[],
            user.id,
            listingId
          ); */
          const formData = new FormData();
          (data.documents as File[]).forEach((file: File) => {
            formData.append("documents", file);
          }
          );
          formData.append("userId", user.id);
          formData.append("listingId", listingId);
          formData.append("methodSelected", "uploadListingDocuments");
          const response = await axios.post("/api/storage/formdata", formData);
          const uploadedDocuments = response.data;
          console.log("4.-uploadedDocuments subidas: ", uploadedDocuments);

          /* await StorageService.saveListingDocuments(
            listingId,
            uploadedDocuments
          ); */
          await axios.post("/api/storage", {
            methodSelected: "saveListingDocuments",
            sentParams: {
              editLinstingId: listingId,
              uploadedDocuments,
            },
          });

          console.log("5.-saveListingDocuments guardadas: ", listingId);
        }

        toast.success("Anuncio creado con éxito");

        // Limpiar datos guardados del formulario ya que se ha enviado correctamente
        await handleDiscardForm();
      }

      // Redirigir a la página de mis anuncios
      router.push("/sell/my-listings");
    } catch (error) {
      console.error("Error al procesar anuncio:", error);
      toast.error(
        "Ha ocurrido un error al procesar el anuncio. Por favor, inténtalo de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guardar borrador (solo para anuncios nuevos)
  const handleSaveDraft = async (data: ListingFormData) => {
    if (!user) {
      toast.error("Debes iniciar sesión para guardar un borrador");
      return;
    }

    try {
      setIsSavingDraft(true);

      // 1. Crear el anuncio como borrador
      //const listingId = await ListingService.saveDraft(data, user.id);
      await axios.post("/api/listing", {
        methodSelected: "saveDraft",
        sentParams: { formData: data },
      });

      // No subimos archivos al guardar como borrador para ahorrar espacio de almacenamiento
      // Los archivos se subirán cuando el usuario decida publicar el anuncio

      toast.success("Borrador guardado con éxito");

      // Limpiar datos guardados del formulario ya que se ha guardado como borrador
      await handleDiscardForm();

      // Redirigir a la página de mis anuncios
      router.push("/sell/my-listings");
    } catch (error) {
      console.error("Error al guardar borrador:", error);
      toast.error(
        "Ha ocurrido un error al guardar el borrador. Por favor, inténtalo de nuevo."
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Previsualizar anuncio
  const handlePreview = (data: ListingFormData) => {
    // En una implementación real, podríamos almacenar estos datos en un estado global
    // o localStorage y redirigir a una página de vista previa
    console.log("Vista previa:", data);

    // Por ahora solo mostramos un toast
    toast.info("Función de vista previa en desarrollo");
  };

  // Función para guardar datos del formulario durante la edición
  const handleAutoSave = (
    formData: Partial<ListingFormData>,
    currentStep: number
  ) => {
    if (user && !editListingId) {
      savePersistedFormData(formData, currentStep);
    }
  };

  // Manejar reinicio del formulario
  const handleResetForm = async () => {
    if (
      confirm(
        "¿Estás seguro de que deseas descartar todos los cambios y comenzar un formulario nuevo? Esta acción no se puede deshacer."
      )
    ) {
      try {
        // Descartar todos los datos guardados
        await handleDiscardForm();

        // Forzar el reinicio del formulario incrementando el contador
        setResetForm((prev) => prev + 1);

        toast.info(
          "Todos los cambios han sido descartados. Puedes comenzar de nuevo."
        );
      } catch (error) {
        console.error("Error al reiniciar el formulario:", error);
        toast.error(
          "No se pudieron descartar los cambios. Por favor intenta de nuevo."
        );
      }
    }
  };

  // Si está cargando la autenticación o los datos del anuncio, mostrar spinner
  if (authLoading || loadingListing) {
    return (
      <div className="container py-10 flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  // Si no está autenticado, mostrar mensaje y botón de login
  if (!isAuthenticated) {
    return (
      <div className="container py-10">
        <div className="max-w-md mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-4">{pageTitle}</h1>
          <p className="mb-8">
            Para publicar un vehículo, primero debes iniciar sesión en tu
            cuenta.
          </p>
          <Button asChild>
            <Link href="/sign-in">Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Formulario de listado (crear o editar)
  return (
    <div className="container py-10">
      <Suspense fallback={<div>Cargando...</div>}>
        <GetSearchParams setEditListingId={setEditListingId} />
      </Suspense>
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {pageTitle}
        </h1>
        <p className="max-w-[800px] text-muted-foreground md:text-xl">
          {pageSubtitle}
        </p>

        {/* Botón para comenzar un formulario limpio, solo mostrar si no estamos editando */}
        {!editListingId && isInitialized && (
          <Button
            variant="outline"
            onClick={handleResetForm}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Comenzar formulario limpio
          </Button>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        <CarListingForm
          key={`form-${resetForm}`} // Usar la key para forzar el remontaje del componente
          onSubmit={handleSubmit}
          onSaveDraft={!editListingId ? handleSaveDraft : undefined}
          onPreview={handlePreview}
          initialData={
            editListingId
              ? initialData
              : persistedData && resetForm === 0
                ? persistedData
                : undefined
          }
          isSubmitting={isSubmitting}
          isSavingDraft={isSavingDraft}
          userId={user?.id}
          onAutoSave={handleAutoSave}
          currentStep={formMeta?.currentStep}
        />
      </div>

      {/* Diálogo de recuperación */}
      <FormRecoveryDialog
        open={showRecoveryDialog}
        onOpenChange={setShowRecoveryDialog}
        onRecover={() => handleRecoverForm(persistedData)}
        onDiscard={handleDiscardForm}
        lastUpdated={formMeta?.lastUpdated || Date.now()}
        progress={calculateProgress()}
      />
    </div>
  );
}
