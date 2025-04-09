'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  saveFormData,
  getFormData,
  getFormMeta,
  checkFormDataExists,
  clearFormData,
  FormMeta
} from '@/utils/form-storage';

// Constantes
const EMERGENCY_PREFIX = 'form_emergency_';
const KEY_LAST_VALUES = `${EMERGENCY_PREFIX}last_values`;
const KEY_LAST_STEP = `${EMERGENCY_PREFIX}last_step`;
const KEY_SAVE_TIMESTAMP = `${EMERGENCY_PREFIX}save_timestamp`;
const KEY_RECOVERY_ATTEMPTED = `${EMERGENCY_PREFIX}recovery_attempted`;
const KEY_RECOVERY_TIMESTAMP = `${EMERGENCY_PREFIX}recovery_timestamp`;

// Tipos
export interface FormPersistenceOptions {
  formId: string;
  userId?: string;
  formVersion?: string;
  emergencyBackupEnabled?: boolean;
  debugMode?: boolean;
}

interface EmergencyData<T> {
  data: T;
  step: number;
  timestamp: number;
}

export interface FileMeta {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

type FormDataType = Record<string, unknown>;

// Safe localStorage utility to prevent SSR errors
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
};

// Función para guardar datos de emergencia
function saveEmergencyData<T extends FormDataType>(data: T, step: number): void {
  try {
    safeLocalStorage.setItem(KEY_LAST_VALUES, JSON.stringify(data));
    safeLocalStorage.setItem(KEY_LAST_STEP, step.toString());
    safeLocalStorage.setItem(KEY_SAVE_TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.error('Error al guardar datos de emergencia:', error);
  }
}

// Función para recuperar datos de emergencia
function getEmergencyData<T extends FormDataType>(): EmergencyData<T> | null {
  try {
    const lastValues = safeLocalStorage.getItem(KEY_LAST_VALUES);
    const lastStep = safeLocalStorage.getItem(KEY_LAST_STEP);
    const lastTimestamp = safeLocalStorage.getItem(KEY_SAVE_TIMESTAMP);
    
    if (!lastValues || !lastTimestamp) return null;
    
    return {
      data: JSON.parse(lastValues) as T,
      step: lastStep ? parseInt(lastStep) : 1,
      timestamp: parseInt(lastTimestamp)
    };
  } catch (error) {
    console.error('Error al recuperar datos de emergencia:', error);
    return null;
  }
}

// Función para limpiar datos de emergencia
function clearEmergencyData(): void {
  safeLocalStorage.removeItem(KEY_LAST_VALUES);
  safeLocalStorage.removeItem(KEY_LAST_STEP);
  safeLocalStorage.removeItem(KEY_SAVE_TIMESTAMP);
}

// Determinar si los datos son recientes (menos de 5 minutos)
function isRecentData(timestamp: number): boolean {
  const now = Date.now();
  const fiveMinutesInMs = 5 * 60 * 1000;
  return now - timestamp < fiveMinutesInMs;
}

// Hook principal
export function useFormPersistence<T extends FormDataType>({
  formId,
  userId,
  formVersion = '1.0',
  emergencyBackupEnabled = true,
  debugMode = false
}: FormPersistenceOptions) {
  // Estados
  const [persistedData, setPersistedData] = useState<T | null>(null);
  const [formMeta, setFormMeta] = useState<FormMeta | null>(null);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [savingEnabled, setSavingEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Función para guardar log
  const log = useCallback((message: string, data?: unknown) => {
    if (debugMode) {
      console.log(`[FormPersistence] ${message}`, data || '');
    }
  }, [debugMode]);

  // Verificar si ya se intentó recuperar anteriormente
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setRecoveryAttempted(safeLocalStorage.getItem(KEY_RECOVERY_ATTEMPTED) === 'true');
  }, []);

  // Guardar datos del formulario de manera segura
  const saveFormDataSafely = useCallback((
    data: T, 
    currentStep: number, 
    filesMeta?: FileMeta[]
  ) => {
    if (!userId || !savingEnabled) return;
    
    try {
      log('Guardando datos del formulario', { currentStep });
      saveFormData(formId, data, {
        userId,
        currentStep,
        formVersion,
        filesMeta
      });
      
      // También guardar como datos de emergencia si está habilitado
      if (emergencyBackupEnabled) {
        saveEmergencyData(data, currentStep);
        log('Datos de emergencia guardados');
      }
    } catch (error) {
      console.error('Error al guardar datos:', error);
    }
  }, [formId, userId, formVersion, savingEnabled, emergencyBackupEnabled, log]);

  // Recuperar datos (con jerarquía de fuentes)
  const loadFormData = useCallback(async () => {
    if (!userId) {
      log('No hay userId, no se pueden cargar datos');
      return null;
    }
    
    log('Intentando cargar datos para formId:', formId);
    
    try {
      // Paso 1: Verificar primero si hay datos de emergencia recientes
      const emergencyData = getEmergencyData<T>();
      
      if (emergencyData && isRecentData(emergencyData.timestamp)) {
        log('Datos de emergencia recientes encontrados', emergencyData);
        
        // Guardar estos datos en el formato normal para futuras recuperaciones
        await saveFormData(formId, emergencyData.data, {
          userId,
          currentStep: emergencyData.step,
          formVersion
        });
        
        // Limpiar datos de emergencia ya que se han guardado en formato normal
        clearEmergencyData();
        
        // Actualizar estados
        setPersistedData(emergencyData.data);
        setFormMeta({
          userId,
          lastUpdated: emergencyData.timestamp,
          currentStep: emergencyData.step,
          formVersion
        });
        
        return emergencyData.data;
      } else if (emergencyData) {
        log('Datos de emergencia encontrados pero no son recientes, limpiando');
        clearEmergencyData();
      }
      
      // Paso 2: Intentar cargar datos normales
      const exists = await checkFormDataExists(formId, userId);
      
      if (exists) {
        log('Datos persistentes encontrados');
        const data = await getFormData<T>(formId, userId);
        const meta = await getFormMeta(formId, userId);
        
        if (data && meta) {
          log('Datos cargados correctamente', { step: meta.currentStep });
          setPersistedData(data);
          setFormMeta(meta);
          return data;
        }
      }
      
      log('No se encontraron datos guardados');
      return null;
    } catch (error) {
      console.error('Error al cargar datos:', error);
      return null;
    }
  }, [formId, userId, formVersion, log]);

  // Limpiar todos los datos
  const clearAllFormData = useCallback(async () => {
    log('Limpiando todos los datos del formulario');
    
    if (userId) {
      // Limpiar datos persistentes
      await clearFormData(formId, userId);
    }
    
    // Limpiar datos de emergencia
    clearEmergencyData();
    
    // Limpiar banderas de recuperación
    safeLocalStorage.removeItem(KEY_RECOVERY_ATTEMPTED);
    safeLocalStorage.removeItem(KEY_RECOVERY_TIMESTAMP);
    
    // Resetear estados
    setPersistedData(null);
    setFormMeta(null);
    setRecoveryAttempted(false);
    setShowRecoveryDialog(false);
    
    log('Datos limpiados correctamente');
  }, [formId, userId, log]);

  // Inicialización y comprobación inicial
  useEffect(() => {
    if (!userId || isInitialized) return;
    
    const initializeFormPersistence = async () => {
      log('Inicializando sistema de persistencia', { userId, formId });
      
      const data = await loadFormData();
      
      if (data) {
        log('Datos recuperados durante inicialización');
        // Si hay datos guardados, mostrar diálogo de recuperación
        setShowRecoveryDialog(true);
      }
      
      // Habilitar guardado automático
      setSavingEnabled(true);
      setIsInitialized(true);
    };
    
    initializeFormPersistence();
  }, [userId, formId, isInitialized, loadFormData, log]);

  // Escuchar cambios de visibilidad para sincronizar
  useEffect(() => {
    if (!userId || !savingEnabled) return;
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        log('Página visible de nuevo, sincronizando datos');
        // Al volver a la pestaña, intentamos recuperar datos frescos
        await loadFormData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId, savingEnabled, loadFormData, log]);

  // Gestionar recuperación de datos
  const handleRecoverForm = useCallback((data: T | null) => {
    log('Iniciando recuperación explícita de datos');
    
    if (data) {
      // Marcar la recuperación como intentada
      safeLocalStorage.setItem(KEY_RECOVERY_ATTEMPTED, 'true');
      safeLocalStorage.setItem(KEY_RECOVERY_TIMESTAMP, Date.now().toString());
      setRecoveryAttempted(true);
    }
    
    setShowRecoveryDialog(false);
    return data;
  }, [log]);

  // Gestionar descarte de datos
  const handleDiscardForm = useCallback(async () => {
    log('Descartando datos guardados');
    await clearAllFormData();
  }, [clearAllFormData, log]);

  // Calcular el progreso del formulario
  const calculateProgress = useCallback(() => {
    if (!persistedData || !formMeta) return 0;
    
    // Obtener el número de campos completados
    const totalFields = Object.keys(persistedData).length;
    const completedFields = Object.entries(persistedData).filter(([_, value]) => {
      // Ignorar campos vacíos o con valores por defecto
      if (value === '' || value === 0 || value === false) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }).length;
    
    // Calcular porcentaje (ajustado para que sea más realista)
    return Math.min(100, Math.round((completedFields / totalFields) * 100));
  }, [persistedData, formMeta]);

  return {
    persistedData,
    formMeta,
    recoveryAttempted,
    showRecoveryDialog,
    setShowRecoveryDialog,
    saveFormData: saveFormDataSafely,
    loadFormData,
    clearFormData: clearAllFormData,
    handleRecoverForm,
    handleDiscardForm,
    calculateProgress,
    isInitialized
  };
} 