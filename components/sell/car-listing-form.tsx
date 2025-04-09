'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
//import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { useTranslation } from '@/utils/translation-context';
import { ListingFormData } from '@/types/listing';
import { CarCategory, FuelType, Transmission } from '@/types/car';
import { useForm, Resolver, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, ArrowRight, Loader2, UploadCloud, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { saveFormData, updateFormStep, getFormMeta, getFormData } from '@/utils/form-storage';
import { useDebounce } from '@/utils/hooks';
import { AutoSaveIndicator } from '@/components/sell/auto-save-indicator';

// Simulación de marcas para el formulario
const MOCK_BRANDS = [
  'Toyota', 
  'Honda', 
  'Volkswagen', 
  'Chevrolet', 
  'Ford', 
  'Nissan', 
  'Hyundai', 
  'Mercedes-Benz', 
  'BMW', 
  'Audi', 
  'Peugeot', 
  'Renault', 
  'Volvo', 
  'Jeep', 
  'Kia', 
  'Mazda', 
  'Subaru', 
  'Dodge',
  'Land Rover',
  'Lexus',
  'Lincoln', 
  'Mitsubishi', 
  'Skoda',
  'Suzuki'
];

// Array para los años
const YEARS = Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => new Date().getFullYear() - i);

// Esquema de validación para el formulario de listado
const listingFormSchema = z.object({
  // Datos básicos del vehículo
  brand: z.string().min(1, { message: "La marca es obligatoria" }),
  model: z.string().min(1, { message: "El modelo es obligatorio" }),
  year: z.coerce.number().min(1990, { message: "El año debe ser válido" }),
  category: z.string().min(1, { message: "La categoría es obligatoria" }),
  
  // Detalles técnicos
  transmission: z.string().min(1, { message: "La transmisión es obligatoria" }),
  fuelType: z.string().min(1, { message: "El tipo de combustible es obligatorio" }),
  mileage: z.coerce.number().min(0, { message: "El kilometraje debe ser válido" }),
  color: z.string().min(1, { message: "El color es obligatorio" }),
  vinNumber: z.string().optional(),
  licensePlate: z.string().optional(),
  
  // Características y descripción
  features: z.array(z.string()).min(1, { message: "Selecciona al menos una característica" }),
  description: z.string().min(50, { message: "La descripción debe tener al menos 50 caracteres" }),
  
  // Ubicación y contacto
  location: z.string().min(1, { message: "La ubicación es obligatoria" }),
  sellerName: z.string().min(1, { message: "El nombre es obligatorio" }),
  sellerEmail: z.string().email({ message: "Email inválido" }),
  sellerPhone: z.string().optional(),
  
  // Precio y condiciones
  price: z.coerce.number().min(1, { message: "El precio es obligatorio" }),
  negotiable: z.boolean().default(false),
  acceptsTrade: z.boolean().optional(),
  
  // Términos y condiciones
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y condiciones"
  })
});

// Lista de características disponibles
const FEATURES = [
  "airConditioning",
  "airbags",
  "alarmSystem",
  "alloyWheels",
  "antiLockBrakes",
  "bluetooth",
  "cruiseControl",
  "electricWindows",
  "fogLights",
  "heatedSeats",
  "leatherSeats",
  "navigation",
  "parkingSensors",
  "powerSteering",
  "rainSensor",
  "reverseCamera",
  "sunroof",
  "touchScreen",
  "usb"
];

interface CarListingFormProps {
  onSubmit: (data: ListingFormData) => void;
  onSaveDraft?: (data: ListingFormData) => void;
  onPreview?: (data: ListingFormData) => void;
  initialData?: Partial<ListingFormData>;
  isSubmitting?: boolean;
  isSavingDraft?: boolean;
  userId?: string;
  onAutoSave?: (data: Partial<ListingFormData>, currentStep: number) => void;
  currentStep?: number;
}

// Constantes
const FORM_ID = 'car-listing-form';
const AUTOSAVE_DEBOUNCE_MS = 3000; // 3 segundos
const FORM_VERSION = '1.0';
const _MAX_IMAGES = 10;
const _MAX_DOCUMENTS = 5;
const _MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Helper function to safely save form data only when userId is a string
const safeSaveFormData = <T extends Record<string, unknown>>(
  data: T,
  options: Omit<Parameters<typeof saveFormData>[2], 'userId'> & { userId?: string }
) => {
  if (typeof options.userId === 'string') {
    console.log(`Guardando datos en localStorage, formId: ${FORM_ID}, paso: ${options.currentStep}`);
    try {
      saveFormData(FORM_ID, data, {
        ...options,
        userId: options.userId
      });
      console.log('Datos guardados correctamente');
    } catch (error) {
      console.error('Error al guardar datos del formulario:', error);
    }
  } else {
    console.warn('No se guardaron los datos: userId no es un string o está vacío', options.userId);
  }
};

type ListingFormValues = z.infer<typeof listingFormSchema>;

export function CarListingForm({
  onSubmit,
  onSaveDraft,
  onPreview,
  initialData,
  isSubmitting = false,
  isSavingDraft = false,
  userId,
  onAutoSave,
  currentStep
}: CarListingFormProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(currentStep || 1);
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [documentNames, setDocumentNames] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pendingSave, setPendingSave] = useState(false);
  const lastSavedDataRef = useRef<string>('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const proactiveRecoveryAttemptedRef = useRef(false);
  const _initialFormKey = useRef(Math.random().toString(36).substring(7));
  
  // Función para limpiar/reiniciar el estado del formulario
  const resetFormState = useCallback(() => {
    console.log('Reseteando estado del formulario');
    setImages([]);
    setDocuments([]);
    setImagePreviewUrls([]);
    setDocumentNames([]);
    setHasUnsavedChanges(false);
    setIsAutoSaving(false);
    setLastSaved(null);
    setPendingSave(false);
    lastSavedDataRef.current = '';
    proactiveRecoveryAttemptedRef.current = false;
    setStep(1);
  }, []);
  
  // Usar el formulario
  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema) as unknown as Resolver<ListingFormValues, FieldValues>,
    mode: 'onBlur',
    defaultValues: {
      brand: initialData?.brand || "",
      model: initialData?.model || "",
      year: initialData?.year || new Date().getFullYear(),
      category: initialData?.category || "",
      transmission: initialData?.transmission || "",
      fuelType: initialData?.fuelType || "",
      mileage: initialData?.mileage || 0,
      color: initialData?.color || "",
      vinNumber: initialData?.vinNumber || "",
      licensePlate: initialData?.licensePlate || "",
      features: initialData?.features as string[] || [],
      description: initialData?.description || "",
      location: initialData?.location || "",
      sellerName: initialData?.sellerName || "",
      sellerEmail: initialData?.sellerEmail || "",
      sellerPhone: initialData?.sellerPhone || "",
      price: initialData?.price || 0,
      negotiable: initialData?.negotiable || false,
      acceptsTrade: initialData?.acceptsTrade || false,
      termsAccepted: false
    }
  });
  
  // Observar cambios en el formulario para el auto-guardado
  const formValues = form.watch();
  const debouncedFormValues = useDebounce(formValues, AUTOSAVE_DEBOUNCE_MS);
  
  // Preparar metadatos de archivos para guardar información sobre ellos
  const prepareFilesMeta = useCallback(() => {
    const filesMeta = [
      ...images.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })),
      ...documents.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }))
    ];
    
    return filesMeta;
  }, [images, documents]);
  
  // Auto-guardar cuando cambian los valores del formulario
  useEffect(() => {
    // Solo guardar si hay userId y si hay datos en el formulario
    if (!userId || Object.keys(debouncedFormValues).length === 0) return;

    // Preparar los datos a guardar
    const currentFormData = {
      ...debouncedFormValues,
      // These fields cannot be saved directly to localStorage
      // as File objects cannot be serialized
      images: [],
      documents: []
    };
    
    // Verificar si los datos han cambiado realmente
    const currentDataString = JSON.stringify(currentFormData);
    if (currentDataString === lastSavedDataRef.current) {
      console.log('Los datos no han cambiado desde el último guardado, omitiendo guardado automático');
      return;
    }
    
    // Marcar que hay una operación de guardado pendiente
    setPendingSave(true);
    
    // Configura un temporizador para el guardado con debounce adicional
    // Esto ayuda a evitar guardados muy frecuentes
    const saveTimer = setTimeout(() => {
      console.log('Ejecutando guardado automático después del debounce');
      setIsAutoSaving(true);
      
      // Usar onAutoSave si está disponible, de lo contrario usar safeSaveFormData directamente
      if (onAutoSave) {
        // Convertir formData a Partial<ListingFormData> para cumplir con los tipos
        const typedFormData: Partial<ListingFormData> = {
          ...currentFormData,
          category: (currentFormData.category as string) as CarCategory,
          transmission: (currentFormData.transmission as string) as Transmission,
          fuelType: (currentFormData.fuelType as string) as FuelType
        };
        onAutoSave(typedFormData, step);
      } else {
        safeSaveFormData(currentFormData, {
          userId,
          currentStep: step,
          filesMeta: prepareFilesMeta(),
          formVersion: FORM_VERSION
        });
      }
      
      // Actualizar la referencia de los últimos datos guardados
      lastSavedDataRef.current = currentDataString;
      
      // Actualizar el estado de guardado
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setPendingSave(false);
      
      // Ocultar el indicador de guardado después de un momento
      setTimeout(() => setIsAutoSaving(false), 1000);
    }, 1000); // Debounce adicional de 1 segundo después del debounce principal
    
    // Limpiar el temporizador si el componente se desmonta o los datos cambian nuevamente
    return () => clearTimeout(saveTimer);
  }, [debouncedFormValues, userId, step, onAutoSave, prepareFilesMeta]);
  
  // Actualizar el paso guardado cuando cambia
  useEffect(() => {
    // Solo actualizar si hay userId
    if (!userId) return;
    
    // Update saved step
    try {
      updateFormStep(FORM_ID, step, userId);
    } catch (error) {
      console.error('Error updating form step:', error);
    }
  }, [step, userId]);
  
  // Guardar cuando el usuario cierra la ventana
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // No hacer nada si no hay userId
      if (!userId) return;
      
      console.log('Evento beforeUnload detectado - guardando datos antes de cerrar/recargar');
      
      // Obtener los datos actuales del formulario
      const currentFormData = {
        ...form.getValues(),
        images: [],
        documents: []
      };
      
      // Convertir a cadena para comparar
      const currentDataString = JSON.stringify(currentFormData);
      
      try {
        // Guardar datos de emergencia siempre (sin comparar con los anteriores)
        // Esto proporciona una capa adicional de seguridad
        localStorage.setItem('form_emergency_last_values', JSON.stringify(currentFormData));
        localStorage.setItem('form_emergency_last_step', step.toString());
        localStorage.setItem('form_emergency_save_timestamp', Date.now().toString());
        console.log('Datos de emergencia guardados para posible recuperación');
        
        // Solo guardar en formato normal si hay cambios respecto al último guardado
        if (currentDataString !== lastSavedDataRef.current) {
          console.log('Cambios detectados, guardando antes de cerrar/recargar la página');
          
          // Convertir formData a Partial<ListingFormData> para cumplir con los tipos
          const typedFormData: Partial<ListingFormData> = {
            ...currentFormData,
            category: (currentFormData.category as string) as CarCategory,
            transmission: (currentFormData.transmission as string) as Transmission,
            fuelType: (currentFormData.fuelType as string) as FuelType
          };
          
          // Usar onAutoSave si está disponible, de lo contrario usar safeSaveFormData directamente
          if (onAutoSave) {
            onAutoSave(typedFormData, step);
          } else {
            // Guardar de forma sincrónica para asegurar que se complete antes de cerrar
            safeSaveFormData(currentFormData, {
              userId,
              currentStep: step,
              filesMeta: prepareFilesMeta(),
              formVersion: FORM_VERSION
            });
          }
          
          // Actualizar la referencia aunque probablemente no se use después de cerrar
          lastSavedDataRef.current = currentDataString;
        } else {
          console.log('No hay cambios para el guardado normal, pero se guardaron datos de emergencia');
        }
      } catch (error) {
        console.error('Error al guardar datos antes de cerrar:', error);
      }
      
      // Mostrar mensaje de confirmación (algunos navegadores lo ignoran)
      event.preventDefault();
      event.returnValue = '¿Estás seguro de que deseas salir? Los cambios han sido guardados.';
      return event.returnValue;
    };

    // Registrar el evento
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, form, step, prepareFilesMeta, onAutoSave]);
  
  // Marcar que hay cambios sin guardar cuando se modifican los archivos
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [images, documents]);
  
  // Auto-guardar cuando cambia el paso del formulario o se desmonta el componente
  useEffect(() => {
    // Actualizar el paso actual en localStorage
    if (userId) {
      updateFormStep(FORM_ID, step, userId);
    }
    
    // Guardar al desmontar el componente
    return () => {
      if (userId && hasUnsavedChanges) {
        const currentFormData = {
          ...form.getValues(),
          images: [],
          documents: []
        };
        
        safeSaveFormData(currentFormData, {
          userId,
          currentStep: step,
          filesMeta: prepareFilesMeta(),
          formVersion: FORM_VERSION
        });
      }
    };
  }, [step, userId, hasUnsavedChanges, form, prepareFilesMeta]);
  
  // Efecto para reiniciar el formulario cuando cambia initialData o su existencia
  useEffect(() => {
    // Comprobar si initialData se ha establecido o ha cambiado a null/undefined
    if (initialData === undefined || initialData === null) {
      console.log('initialData es null o undefined, reseteando formulario');
      form.reset({
        brand: "",
        model: "",
        year: new Date().getFullYear(),
        category: "",
        transmission: "",
        fuelType: "",
        mileage: 0,
        color: "",
        vinNumber: "",
        licensePlate: "",
        features: [],
        description: "",
        location: "",
        sellerName: "",
        sellerEmail: "",
        sellerPhone: "",
        price: 0,
        negotiable: false,
        acceptsTrade: false,
        termsAccepted: false
      });
      
      resetFormState();
      return;
    }
    
    // Si hay initialData, actualizar formulario
    console.log('Actualizando formulario con initialData:', initialData);
    form.reset(initialData);
    
    // Si hay paso guardado, establecerlo
    if (currentStep) {
      setStep(currentStep);
    }
    
    // Actualizar lastSavedDataRef para prevenir guardado innecesario
    lastSavedDataRef.current = JSON.stringify({
      ...initialData,
      images: [],
      documents: []
    });
    
    // Mostrar mensaje de éxito de recuperación brevemente
    setRecoverySuccess(true);
    setTimeout(() => setRecoverySuccess(false), 3000);
  }, [initialData, form, currentStep, resetFormState]);
  
  // Verificación de que los datos iniciales se aplicaron correctamente
  useEffect(() => {
    // Ejecutar solo una vez después de que initialData se haya procesado
    if (!initialData) return;
    
    const timer = setTimeout(() => {
      const currentValues = form.getValues();
      console.log('Verificación de valores aplicados:', {
        hasInitialBrand: !!initialData.brand,
        currentBrand: currentValues.brand,
        valuesMatch: initialData.brand === currentValues.brand
      });
      
      // Si los valores no coinciden, intentar aplicar de nuevo
      if (initialData.brand && currentValues.brand !== initialData.brand) {
        console.log('Los valores no se aplicaron correctamente, reintentando');
        form.reset(initialData);
        
        // Mostrar mensaje de recuperación exitosa
        setRecoverySuccess(true);
        setTimeout(() => setRecoverySuccess(false), 3000);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [initialData, form]);
  
  // Debug de valores iniciales - ayuda a diagnosticar problemas de persistencia
  useEffect(() => {
    if (initialData) {
      console.log('CarListingForm: initialData aplicado al formulario', initialData);
      
      // Verificar si los valores iniciales se aplicaron correctamente
      const currentValues = form.getValues();
      console.log('CarListingForm: valores actuales del formulario', currentValues);
      
      // Reiniciar formulario con los valores iniciales si es necesario
      if (Object.keys(currentValues).length === 0 || 
          (currentValues.brand === "" && initialData.brand)) {
        console.log('CarListingForm: Reiniciando formulario con valores iniciales');
        form.reset(initialData);
      }
    }
  }, [initialData, form]);
  
  // Recuperación proactiva si no hay datos iniciales pero sí hay userId
  useEffect(() => {
    // Evitar intentos repetidos de recuperación proactiva
    if (proactiveRecoveryAttemptedRef.current) return;
    
    // Solo intentar recuperación proactiva si tenemos userId pero no initialData
    if (userId && !initialData) {
      console.log('Iniciando recuperación proactiva en CarListingForm');
      proactiveRecoveryAttemptedRef.current = true;
      
      try {
        const savedData = getFormData(FORM_ID, userId);
        console.log('Resultado de recuperación proactiva:', !!savedData);
        
        if (savedData) {
          console.log('Datos encontrados en recuperación proactiva', savedData);
          
          // Aplicar directamente al formulario con casting seguro
          form.reset(savedData as unknown as Partial<ListingFormData>);
          
          // Actualizar estado para UI
          const meta = getFormMeta(FORM_ID, userId);
          if (meta) {
            console.log('Metadatos recuperados proactivamente:', meta);
            setStep(meta.currentStep || 1);
            setLastSaved(new Date(meta.lastUpdated));
          }
          
          // Actualizar referencia para evitar guardados innecesarios
          lastSavedDataRef.current = JSON.stringify({
            ...savedData,
            images: [],
            documents: []
          });
          
          // Mostrar mensaje de éxito brevemente
          setRecoverySuccess(true);
          setTimeout(() => setRecoverySuccess(false), 3000);
          
          console.log('Recuperación proactiva completada con éxito');
        }
      } catch (error) {
        console.error('Error en recuperación proactiva:', error);
      }
    }
  }, [userId, initialData, form]);
  
  // Gestionar avance al siguiente paso
  const handleNextStep = async () => {
    let fieldsToValidate: string[] = [];
    
    // Campos a validar según el paso actual
    if (step === 1) {
      fieldsToValidate = ['brand', 'model', 'year', 'category'];
    } else if (step === 2) {
      fieldsToValidate = ['transmission', 'fuelType', 'mileage', 'color'];
    } else if (step === 3) {
      fieldsToValidate = ['features', 'description', 'location'];
    } else if (step === 4) {
      fieldsToValidate = ['price'];
    }
    
    // Validar los campos del paso actual
    const result = await form.trigger(fieldsToValidate as Array<keyof z.infer<typeof listingFormSchema>>);
    
    if (result) {
      if (step === 3 && images.length === 0) {
        form.setError('root', { 
          message: "Debes subir al menos una imagen del vehículo" 
        });
        return;
      }
      
      // Solo guardar explícitamente si no hay un guardado pendiente
      if (userId && !pendingSave) {
        const currentFormData = {
          ...form.getValues(),
          images: [],
          documents: []
        };
      
        // Indicar que estamos guardando
        setIsAutoSaving(true);
        
        // Convertir a cadena para comparar con el último guardado
        const currentDataString = JSON.stringify(currentFormData);
        
        // Solo guardar si los datos han cambiado
        if (currentDataString !== lastSavedDataRef.current) {
          console.log('Guardando datos antes de avanzar al siguiente paso');
          
          // Guardar los datos
          safeSaveFormData(currentFormData, {
            userId,
            currentStep: step + 1, // Guardar con el paso al que vamos a avanzar
            filesMeta: prepareFilesMeta(),
            formVersion: FORM_VERSION
          });
          
          // Actualizar la referencia de datos
          lastSavedDataRef.current = currentDataString;
          
          // Actualizar estado de guardado
          setLastSaved(new Date());
        } else {
          console.log('Los datos no han cambiado, solo actualizando el paso');
          // Solo actualizar el paso
          updateFormStep(FORM_ID, step + 1, userId);
        }
        
        // Ocultar indicador de guardado después de un momento
        setTimeout(() => setIsAutoSaving(false), 1000);
      }
      
      // Avanzar al siguiente paso
      setStep(current => current + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Gestionar retroceso al paso anterior
  const handlePreviousStep = () => {
    // Solo guardar explícitamente si no hay un guardado pendiente
    if (userId && !pendingSave) {
      const currentFormData = {
        ...form.getValues(),
        images: [],
        documents: []
      };
      
      // Convertir a cadena para comparar con el último guardado
      const currentDataString = JSON.stringify(currentFormData);
      
      // Solo guardar si los datos han cambiado
      if (currentDataString !== lastSavedDataRef.current) {
        // Indicar que estamos guardando
        setIsAutoSaving(true);
        
        console.log('Guardando datos antes de retroceder al paso anterior');
        
        // Guardar los datos
        safeSaveFormData(currentFormData, {
          userId,
          currentStep: Math.max(1, step - 1), // Guardar con el paso al que vamos a retroceder
          filesMeta: prepareFilesMeta(),
          formVersion: FORM_VERSION
        });
        
        // Actualizar la referencia de datos
        lastSavedDataRef.current = currentDataString;
        
        // Actualizar estado de guardado
        setLastSaved(new Date());
        
        // Ocultar indicador de guardado después de un momento
        setTimeout(() => setIsAutoSaving(false), 1000);
      } else {
        console.log('Los datos no han cambiado, solo actualizando el paso');
        // Solo actualizar el paso
        updateFormStep(FORM_ID, Math.max(1, step - 1), userId);
      }
    }
    
    // Retroceder al paso anterior
    setStep(current => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Configuración de dropzone para imágenes
  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 20,
    onDrop: (acceptedFiles) => {
      // Añadir las nuevas imágenes
      const newImages = [...images, ...acceptedFiles];
      setImages(newImages.slice(0, 20)); // Máximo 20 imágenes
      
      // Generar URLs de vista previa
      const newImageUrls = acceptedFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls([...imagePreviewUrls, ...newImageUrls]);
    }
  });
  
  // Configuración de dropzone para documentos
  const { getRootProps: getDocumentRootProps, getInputProps: getDocumentInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      // Añadir los nuevos documentos
      const newDocuments = [...documents, ...acceptedFiles];
      setDocuments(newDocuments.slice(0, 5)); // Máximo 5 documentos
      
      // Guardar nombres de documentos
      const newDocumentNames = acceptedFiles.map(file => file.name);
      setDocumentNames([...documentNames, ...newDocumentNames]);
    }
  });
  
  // Eliminar imagen
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    const newImageUrls = [...imagePreviewUrls];
    URL.revokeObjectURL(newImageUrls[index]);
    newImageUrls.splice(index, 1);
    setImagePreviewUrls(newImageUrls);
  };
  
  // Eliminar documento
  const removeDocument = (index: number) => {
    const newDocuments = [...documents];
    newDocuments.splice(index, 1);
    setDocuments(newDocuments);
    
    const newDocumentNames = [...documentNames];
    newDocumentNames.splice(index, 1);
    setDocumentNames(newDocumentNames);
  };
  
  // Manejar envío del formulario
  const handleSubmitForm = (data: z.infer<typeof listingFormSchema>) => {
    // Verificar imágenes
    if (images.length === 0) {
      form.setError('root', { 
        message: "Debes subir al menos una imagen del vehículo" 
      });
      return;
    }
    
    // Formatear datos para enviar
    const formData: ListingFormData = {
      ...data,
      category: data.category as CarCategory,
      transmission: data.transmission as Transmission,
      fuelType: data.fuelType as FuelType,
      images, // Archivos de imágenes
      documents // Archivos de documentos
    };
    
    onSubmit(formData);
  };
  
  // Guardar como borrador
  const handleSaveDraft = () => {
    if (onSaveDraft) {
      const formValues = form.getValues();
      const draftData = {
        ...formValues,
        category: formValues.category as CarCategory,
        transmission: formValues.transmission as Transmission,
        fuelType: formValues.fuelType as FuelType,
        images,
        documents
      } as ListingFormData;
      
      onSaveDraft(draftData);
    }
  };
  
  // Ver vista previa
  const handlePreview = () => {
    if (onPreview) {
      const previewData = {
        ...form.getValues(),
        images: imagePreviewUrls, // URLs de imágenes para previsualización
        documents: documentNames // Nombres de documentos para previsualización
      } as unknown as ListingFormData;
      
      onPreview(previewData);
    }
  };
  
  // Renderizar el componente
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`sell.listing.form.step${step}Title`)}</CardTitle>
        
        {/* Indicador de recuperación exitosa */}
        {recoverySuccess && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 my-2 rounded">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Datos del formulario recuperados correctamente</span>
            </div>
          </div>
        )}
        
        {/* Indicador de progreso */}
        <div className="mt-4">
          <div className="flex justify-between mb-2">
            <span className={`text-xs sm:text-sm font-medium ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              {t('sell.listing.form.step1Title')}
            </span>
            <span className={`text-xs sm:text-sm font-medium ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              {t('sell.listing.form.step2Title')}
            </span>
            <span className={`text-xs sm:text-sm font-medium ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              {t('sell.listing.form.step3Title')}
            </span>
            <span className={`text-xs sm:text-sm font-medium ${step >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
              {t('sell.listing.form.step4Title')}
            </span>
            <span className={`text-xs sm:text-sm font-medium ${step === 5 ? 'text-primary' : 'text-muted-foreground'}`}>
              {t('sell.listing.form.step5Title')}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
          
          {/* Indicador de guardado automático */}
          {userId && (
            <div className="flex justify-end mt-2">
              <AutoSaveIndicator 
                status={isAutoSaving ? 'saving' : pendingSave ? 'saving' : lastSaved ? 'saved' : 'idle'}
                lastSaveTime={lastSaved ? lastSaved.getTime() : undefined}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
            {/* Error general del formulario */}
            {form.formState.errors.root && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {form.formState.errors.root.message}
              </div>
            )}
            
            {/* Paso 1: Datos básicos */}
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.brandLabel')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar marca" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOCK_BRANDS.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.modelLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Corolla" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.yearLabel')}</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar año" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {YEARS.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.categoryLabel')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sedan">Sedán</SelectItem>
                          <SelectItem value="suv">SUV</SelectItem>
                          <SelectItem value="hatchback">Hatchback</SelectItem>
                          <SelectItem value="pickup">Pickup</SelectItem>
                          <SelectItem value="coupe">Coupé</SelectItem>
                          <SelectItem value="convertible">Convertible</SelectItem>
                          <SelectItem value="wagon">Familiar</SelectItem>
                          <SelectItem value="van">Van</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {/* Paso 2: Características técnicas */}
            {step === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="transmission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.transmissionLabel')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar transmisión" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="automatic">Automática</SelectItem>
                          <SelectItem value="cvt">CVT</SelectItem>
                          <SelectItem value="semi-automatic">Semi-automática</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fuelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.fuelTypeLabel')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar combustible" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gasoline">Gasolina</SelectItem>
                          <SelectItem value="diesel">Diésel</SelectItem>
                          <SelectItem value="electric">Eléctrico</SelectItem>
                          <SelectItem value="hybrid">Híbrido</SelectItem>
                          <SelectItem value="plugin_hybrid">Híbrido enchufable</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.mileageLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('sell.listing.form.mileagePlaceholder')} 
                          {...field}
                          onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.colorLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('sell.listing.form.colorPlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vinNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('sell.listing.form.vinLabel')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('sell.listing.form.vinPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Opcional
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="licensePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('sell.listing.form.licensePlateLabel')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('sell.listing.form.licensePlatePlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Opcional
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {/* Paso 3: Descripción y fotos */}
            {step === 3 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>{t('sell.listing.form.featuresLabel')}</FormLabel>
                        <FormDescription>
                          {t('sell.listing.form.featuresPlaceholder')}
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {FEATURES.map((feature) => (
                          <FormField
                            key={feature}
                            control={form.control}
                            name="features"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={feature}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(feature)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value || [], feature])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== feature
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {feature}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.descriptionLabel')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('sell.listing.form.descriptionPlaceholder')}
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.locationLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('sell.listing.form.locationPlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <h3 className="mb-2 font-medium">{t('sell.listing.form.imagesLabel')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('sell.listing.form.imagesDescription')}
                  </p>
                  
                  <div 
                    {...getImageRootProps()} 
                    className="border-2 border-dashed rounded-md p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <input {...getImageInputProps()} />
                    <UploadCloud className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('sell.listing.form.imagesDropzoneText')}
                    </p>
                  </div>
                  
                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Imágenes seleccionadas ({imagePreviewUrls.length})</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {imagePreviewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <div className="relative aspect-[4/3] overflow-hidden rounded-md">
                              <Image 
                                src={url} 
                                alt={`Preview ${index + 1}`} 
                                fill
                                className="object-cover" 
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              &times;
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="mb-2 font-medium">{t('sell.listing.form.documentsLabel')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('sell.listing.form.documentsDescription')}
                  </p>
                  
                  <div 
                    {...getDocumentRootProps()} 
                    className="border-2 border-dashed rounded-md p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <input {...getDocumentInputProps()} />
                    <UploadCloud className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('sell.listing.form.documentsDropzoneText')}
                    </p>
                  </div>
                  
                  {documentNames.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Documentos seleccionados ({documentNames.length})</h4>
                      <div className="space-y-2">
                        {documentNames.map((name, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted rounded-md">
                            <span className="text-sm truncate">{name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeDocument(index)}
                            >
                              &times;
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Paso 4: Precio y condiciones */}
            {step === 4 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.priceLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('sell.listing.form.pricePlaceholder')} 
                          {...field}
                          onChange={e => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="negotiable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {t('sell.listing.form.negotiableLabel')}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="acceptsTrade"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {t('sell.listing.form.acceptsTradeLabel')}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {/* Paso 5: Información de contacto */}
            {step === 5 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="sellerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.sellerNameLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('sell.listing.form.sellerNamePlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sellerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.sellerEmailLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder={t('sell.listing.form.sellerEmailPlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sellerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.sellerPhoneLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('sell.listing.form.sellerPhonePlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Opcional
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator className="my-4" />
                
                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          {t('sell.listing.form.termsLabel')}
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {/* Botones de navegación */}
            <div className="flex flex-wrap justify-between gap-4 pt-4">
              <div>
                {step > 1 ? (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handlePreviousStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('sell.listing.form.backButton')}
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('common.back_to_list')}
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* Botón de guardado de borrador (siempre visible) */}
                {onSaveDraft && (
                  <Button 
                    type="button" 
                    variant="outline"
                    disabled={isSavingDraft}
                    onClick={handleSaveDraft}
                  >
                    {isSavingDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('sell.listing.form.draftButton')}
                  </Button>
                )}
                
                {/* Botones según el paso */}
                {step < 5 ? (
                  <Button 
                    type="button"
                    onClick={handleNextStep}
                  >
                    {t('sell.listing.form.nextButton')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    {onPreview && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handlePreview}
                      >
                        {t('sell.listing.form.previewButton')}
                      </Button>
                    )}
                    
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('sell.listing.form.submitButton')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 