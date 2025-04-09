'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/utils/translation-context';
import { formatRelativeTime } from '@/utils/format';
import { AlertTriangle, Clock } from 'lucide-react';

interface FormRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecover: () => void;
  onDiscard: () => void;
  lastUpdated: number;
  progress?: number;
}

export function FormRecoveryDialog({
  open,
  onOpenChange,
  onRecover,
  onDiscard,
  lastUpdated,
  progress = 0
}: FormRecoveryDialogProps) {
  const { t } = useTranslation();
  const [timeText, setTimeText] = useState<string>('');
  
  // Actualizar el texto del tiempo cada minuto
  useEffect(() => {
    const updateTimeText = () => {
      setTimeText(formatRelativeTime(lastUpdated));
    };
    
    // Actualizar inmediatamente
    updateTimeText();
    
    // Configurar intervalo para actualizar cada minuto
    const interval = setInterval(updateTimeText, 60000);
    
    return () => clearInterval(interval);
  }, [lastUpdated]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {t('formRecovery.title')}
          </DialogTitle>
          <DialogDescription>
            {t('formRecovery.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Clock className="h-4 w-4" />
            <span>
              {t('formRecovery.lastEdited')}: {timeText}
            </span>
          </div>
          
          {progress > 0 && (
            <div className="mt-2">
              <div className="text-sm mb-1">
                {t('formRecovery.progress')}: {Math.round(progress)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="sm:mt-0 mb-2 sm:mb-0"
          >
            {t('formRecovery.discard')}
          </Button>
          <Button onClick={onRecover}>
            {t('formRecovery.recover')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 