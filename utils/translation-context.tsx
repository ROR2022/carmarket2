/* eslint-disable no-unused-vars */
"use client"

import React, { createContext, useContext } from 'react'
import esTranslations from '@/translations/es.json'

// Define un tipo para el contexto
type TranslationContextType = {
  t: (path: string) => string
}

// Crear el contexto
const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

// Proveedor del contexto
export function TranslationProvider({ children }: { children: React.ReactNode }) {
  // Función para obtener un valor de traducción utilizando una ruta de acceso como "navbar.buy"
  const t = (path: string): string => {
    const keys = path.split('.')
    let value: Record<string, unknown> = esTranslations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k] as Record<string, unknown>
      } else {
        console.warn(`Translation key not found: ${path}`)
        return path
      }
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    console.warn(`Translation value for ${path} is not a string:`, value);
    return path;
  }

  return (
    <TranslationContext.Provider value={{ t }}>
      {children}
    </TranslationContext.Provider>
  )
}

// Hook personalizado para usar las traducciones
export function useTranslation() {
  const context = useContext(TranslationContext)
  
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  
  return context
} 