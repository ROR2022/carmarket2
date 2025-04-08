'use client';

import { useState } from 'react';
import { Car } from '@/types/car';
import { useAuth } from '@/utils/auth-hooks';
import { useTranslation } from '@/utils/translation-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/utils/format';

interface ContactSellerDialogProps {
  car: Car;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (message: ContactMessageData) => Promise<void>;
}

export interface ContactMessageData {
  subject: string;
  message: string;
  includePhone: boolean;
}

export function ContactSellerDialog({
  car,
  isOpen,
  onOpenChange,
  onSendMessage,
}: ContactSellerDialogProps) {
  const { t } = useTranslation();
  const { user: _user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactMessageData>({
    subject: `${t('cars.contactData.regarding')} ${car.title}`,
    message: '',
    includePhone: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      includePhone: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (formData.message.trim().length < 20) {
      setError(t('cars.contactData.message_too_short'));
      return;
    }
    
    setError(null);
    setSubmitting(true);
    
    try {
      console.log('----ROR2022----inicia el envío...');
      await onSendMessage(formData);
      console.log('----ROR2022----mensaje enviado...');
      setFormData({
        subject: `${t('cars.contactData.regarding')} ${car.title}`,
        message: '',
        includePhone: false,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(
        typeof err === 'string' 
          ? err 
          : err instanceof Error 
            ? err.message 
            : t('cars.contactData.error_sending')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('cars.contactData.title')}</DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-foreground font-medium">{car.title}</span>
              <span className="text-foreground font-bold">
                {formatCurrency(car.price)}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">{t('cars.contactData.subject')}</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">{t('cars.contactData.message')}</Label>
            <Textarea
              id="message"
              name="message"
              rows={5}
              placeholder={t('cars.contactData.message_placeholder')}
              value={formData.message}
              onChange={handleInputChange}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {t('cars.contactData.min_chars')}
            </p>
            {formData.message.length > 0 && (
              <p className="text-xs text-muted-foreground text-right">
                {formData.message.length} / 500
              </p>
            )}
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="includePhone"
              checked={formData.includePhone}
              onCheckedChange={handleCheckboxChange}
            />
            <Label
              htmlFor="includePhone"
              className="text-sm leading-tight cursor-pointer"
            >
              {t('cars.contactData.include_phone')}
            </Label>
          </div>
          
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('common.sending') : t('cars.contactData.send')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 