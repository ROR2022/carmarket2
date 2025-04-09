'use client';

/**
 * FormStorageService
 * 
 * Este servicio maneja el guardado y recuperación de datos de formularios en localStorage.
 * Proporciona funcionalidades para:
 * - Guardar formularios en progreso
 * - Recuperar datos guardados
 * - Limpiar datos antiguos
 * - Gestionar la expiración de datos
 */

/**
 * Tipo para los metadatos de archivos
 */
export type FileMeta = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

/**
 * Tipo para los metadatos del formulario
 */
export type FormMeta = {
  userId: string;
  formVersion: string;
  currentStep: number;
  lastUpdated: number;
  filesMeta?: FileMeta[];
};

/**
 * Tipo para datos de formulario genéricos
 */
export type FormDataType = Record<string, unknown>;

// Constantes para la configuración del almacenamiento
const STORAGE_KEY_PREFIX = 'form_autosave_';
const DEFAULT_EXPIRATION_DAYS = 7; // 7 días por defecto
const MAX_FILE_METADATA_ITEMS = 20; // Número máximo de archivos a guardar metadatos
const SAVED_FORMS_LIST_KEY = 'saved_forms_list';

// Tipo para la lista de formularios guardados
interface SavedFormInfo {
  key: string;
  formId: string;
  userId?: string;
  savedAt: number;
}

/**
 * Genera una clave única para el almacenamiento basada en un identificador y un usuario
 */
const getStorageKey = (formId: string, userId?: string): string => {
  return `${STORAGE_KEY_PREFIX}${formId}${userId ? '_' + userId : ''}`;
};

/**
 * Actualiza la lista de formularios guardados
 */
const updateSavedFormsList = (storageKey: string, formId: string, userId?: string): void => {
  try {
    const savedFormsListStr = localStorage.getItem(SAVED_FORMS_LIST_KEY);
    const savedFormsList: SavedFormInfo[] = savedFormsListStr 
      ? JSON.parse(savedFormsListStr) 
      : [];
    
    // Verificar si el formulario ya está en la lista
    const existingIndex = savedFormsList.findIndex(item => item.key === storageKey);
    
    const now = Date.now();
    
    if (existingIndex >= 0) {
      // Actualizar la entrada existente
      savedFormsList[existingIndex].savedAt = now;
    } else {
      // Añadir nueva entrada
      savedFormsList.push({
        key: storageKey,
        formId,
        userId,
        savedAt: now
      });
    }
    
    // Guardar la lista actualizada
    localStorage.setItem(SAVED_FORMS_LIST_KEY, JSON.stringify(savedFormsList));
  } catch (error) {
    console.error('Error al actualizar la lista de formularios guardados:', error);
  }
};

/**
 * Elimina un formulario de la lista de guardados
 */
const removeFromSavedFormsList = (storageKey: string): void => {
  try {
    const savedFormsListStr = localStorage.getItem(SAVED_FORMS_LIST_KEY);
    if (!savedFormsListStr) return;
    
    const savedFormsList: SavedFormInfo[] = JSON.parse(savedFormsListStr);
    
    // Filtrar la entrada a eliminar
    const updatedList = savedFormsList.filter(item => item.key !== storageKey);
    
    // Guardar la lista actualizada
    localStorage.setItem(SAVED_FORMS_LIST_KEY, JSON.stringify(updatedList));
  } catch (error) {
    console.error('Error al eliminar de la lista de formularios guardados:', error);
  }
};

/**
 * Guarda los datos del formulario en localStorage
 */
export function saveFormData<T extends FormDataType>(
  formId: string, 
  data: T, 
  options: {
    userId: string;
    currentStep?: number;
    expirationDays?: number;
    filesMeta?: FileMeta[];
    formVersion?: string;
  }
): void {
  try {
    const now = Date.now();
    const expirationDays = options.expirationDays || DEFAULT_EXPIRATION_DAYS;
    const expirationDate = now + (expirationDays * 24 * 60 * 60 * 1000);
    
    const storageKey = getStorageKey(formId, options.userId);
    
    // Estructura de los datos a guardar
    const formDataToStore = {
      data,
      metadata: {
        userId: options.userId,
        lastUpdated: now,
        expirationDate,
        currentStep: options.currentStep,
        formVersion: options.formVersion || '1.0'
      },
      filesMeta: options.filesMeta?.slice(0, MAX_FILE_METADATA_ITEMS) || []
    };
    
    // Guardar en localStorage
    localStorage.setItem(storageKey, JSON.stringify(formDataToStore));
    
    // Actualizar la lista de formularios guardados
    updateSavedFormsList(storageKey, formId, options.userId);
    
  } catch (error) {
    console.error('Error al guardar datos del formulario:', error);
  }
}

/**
 * Recupera los datos guardados de un formulario
 */
export function getFormData<T extends FormDataType>(
  formId: string, 
  userId: string
): T | null {
  try {
    const storageKey = getStorageKey(formId, userId);
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) return null;
    
    const parsedData = JSON.parse(storedData);
    
    // Verificar si los datos han expirado
    if (parsedData.metadata.expirationDate < Date.now()) {
      // Si han expirado, eliminarlos y retornar null
      clearFormData(formId, userId);
      return null;
    }
    
    return parsedData.data as T;
  } catch (error) {
    console.error('Error al recuperar datos del formulario:', error);
    return null;
  }
}

/**
 * Recupera los metadatos del formulario
 */
export function getFormMeta(
  formId: string, 
  userId: string
): FormMeta | null {
  try {
    const storageKey = getStorageKey(formId, userId);
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) return null;
    
    const parsedData = JSON.parse(storedData);
    
    // Verificar si los datos han expirado
    if (parsedData.metadata.expirationDate < Date.now()) {
      // Si han expirado, eliminarlos y retornar null
      clearFormData(formId, userId);
      return null;
    }
    
    return parsedData.metadata as FormMeta;
  } catch (error) {
    console.error('Error al recuperar metadatos del formulario:', error);
    return null;
  }
}

/**
 * Elimina los datos guardados de un formulario
 */
export function clearFormData(formId: string, userId: string): void {
  try {
    const storageKey = getStorageKey(formId, userId);
    localStorage.removeItem(storageKey);
    
    // Actualizar la lista de formularios guardados
    removeFromSavedFormsList(storageKey);
    
  } catch (error) {
    console.error('Error al eliminar datos del formulario:', error);
  }
}

/**
 * Actualiza el paso actual del formulario guardado
 */
export function updateFormStep(formId: string, step: number, userId: string): void {
  try {
    const storageKey = getStorageKey(formId, userId);
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) return;
    
    const parsedData = JSON.parse(storedData);
    
    // Actualizar el paso actual
    parsedData.metadata.currentStep = step;
    parsedData.metadata.lastUpdated = Date.now();
    
    // Guardar los datos actualizados
    localStorage.setItem(storageKey, JSON.stringify(parsedData));
  } catch (error) {
    console.error('Error al actualizar el paso del formulario:', error);
  }
}

/**
 * Limpia todos los datos de formularios que han expirado
 */
export function cleanupExpiredFormData(): void {
  try {
    const savedFormsListStr = localStorage.getItem(SAVED_FORMS_LIST_KEY);
    if (!savedFormsListStr) return;
    
    const savedFormsList: SavedFormInfo[] = JSON.parse(savedFormsListStr);
    const now = Date.now();
    const keysToCheck = [...savedFormsList];
    let _removed = 0;
    
    // Verificar cada entrada
    for (const formInfo of keysToCheck) {
      const storedData = localStorage.getItem(formInfo.key);
      
      if (!storedData) {
        // Si no hay datos, eliminar de la lista
        removeFromSavedFormsList(formInfo.key);
        _removed++;
        continue;
      }
      
      try {
        const parsedData = JSON.parse(storedData);
        
        // Verificar si ha expirado
        if (parsedData.metadata.expirationDate < now) {
          localStorage.removeItem(formInfo.key);
          removeFromSavedFormsList(formInfo.key);
          _removed++;
        }
      } catch {
        // Si hay error al parsear, también eliminar
        localStorage.removeItem(formInfo.key);
        removeFromSavedFormsList(formInfo.key);
        _removed++;
      }
    }
  } catch (error) {
    console.error('Error al limpiar datos de formularios expirados:', error);
  }
}

/**
 * Verifica si existe un formulario guardado para el ID y usuario dado
 */
export function checkFormDataExists(formId: string, userId: string): boolean {
  try {
    const storageKey = getStorageKey(formId, userId);
    return localStorage.getItem(storageKey) !== null;
  } catch (error) {
    console.error('Error al verificar existencia de datos del formulario:', error);
    return false;
  }
} 