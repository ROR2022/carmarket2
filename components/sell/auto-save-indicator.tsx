'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { formatRelativeTime } from '@/utils/format';

export interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaveTime?: number;
  onRetry?: () => void;
}

export function AutoSaveIndicator({ 
  status, 
  lastSaveTime,
  onRetry 
}: AutoSaveIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');
  
  // Actualizar el tiempo transcurrido desde el último guardado
  useEffect(() => {
    if (!lastSaveTime) return;
    
    const updateTimeAgo = () => {
      setTimeAgo(formatRelativeTime(lastSaveTime));
    };
    
    // Actualizar inmediatamente
    updateTimeAgo();
    
    // Actualizar cada 15 segundos
    const interval = setInterval(updateTimeAgo, 15000);
    return () => clearInterval(interval);
  }, [lastSaveTime]);
  
  // Renderizar el indicador según el estado
  return (
    <div className="flex items-center gap-2 text-xs">
      {status === 'idle' && lastSaveTime && (
        <>
          <Check className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">
            Guardado {timeAgo}
          </span>
        </>
      )}
      
      {status === 'saving' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span className="text-muted-foreground">
            Guardando...
          </span>
        </>
      )}
      
      {status === 'saved' && (
        <>
          <Check className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">
            Guardado automáticamente
          </span>
        </>
      )}
      
      {status === 'error' && (
        <>
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          <span className="text-muted-foreground">
            Error al guardar
          </span>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="text-primary underline hover:text-primary/80"
            >
              Reintentar
            </button>
          )}
        </>
      )}
    </div>
  );
} 