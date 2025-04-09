'use client';

import { useState, useEffect } from 'react';

/**
 * Hook personalizado para implementar un debounce en cualquier valor
 * Útil para operaciones costosas como guardado automático o búsquedas
 * 
 * @param value El valor a debounce
 * @param delay Tiempo de espera en milisegundos
 * @returns El valor con debounce aplicado
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configurar un temporizador para actualizar el valor después del delay
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    
    // Limpiar el temporizador si el valor cambia antes del delay
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
} 