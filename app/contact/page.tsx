'use client';

import { useTranslation } from '@/utils/translation-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export default function ContactPage() {
  const { t } = useTranslation();

  // Definir el esquema de validación con mensajes traducidos
  const formSchema = z.object({
    name: z.string().min(2, { message: t('contact.form.validation.nameRequired') }),
    email: z.string().email({ message: t('contact.form.validation.emailInvalid') }),
    subject: z.string().min(3, { message: t('contact.form.validation.subjectRequired') }),
    message: z.string().min(10, { message: t('contact.form.validation.messageLength') }),
  });

  // Definir el tipo para nuestros datos
  type FormData = z.infer<typeof formSchema>;

  // Estados para el feedback del formulario
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Inicializar react-hook-form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  // Función para manejar el envío del formulario
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    toast.success('Enviando mensaje de contacto...');

    try {
      // Inicializar cliente de Supabase
      const supabase = createClient();

      // Insertar datos en la tabla contact_messages
      const { error } = await supabase.from('contact_messages').insert([
        {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          status: 'unread',
        },
      ]);

      // Manejar error si ocurre
      if (error) {
        console.error('Error al enviar formulario:', error);
        toast.error('Error al enviar formulario');
        throw new Error(error.message);
      }

      console.log('Mensaje de contacto guardado en Supabase:', data);
      toast.success('Mensaje de contacto guardado en Supabase');

      // Limpiar el formulario
      form.reset();
      setSubmitSuccess(true);

      // Ocultar el mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('contact.form.genericError'));
      console.error('Error al enviar formulario:', error);
      toast.error('Error al enviar formulario');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('contact.title')}</CardTitle>
            <CardDescription>{t('contact.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium">{t('contact.email.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('contact.email.value')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium">{t('contact.phone.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('contact.phone.value')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium">{t('contact.address.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('contact.address.value')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('contact.form.title')}</CardTitle>
            <CardDescription>{t('contact.form.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mensajes de feedback con traducciones */}
            {submitSuccess && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 dark:bg-green-900/20 dark:border-green-400 animate-fadeIn">
                <p className="text-green-700 dark:text-green-300">{t('contact.form.successMessage')}</p>
              </div>
            )}

            {submitError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 dark:bg-red-900/20 dark:border-red-400 animate-fadeIn">
                <p className="text-red-700 dark:text-red-300">{t('contact.form.errorMessage')}</p>
                <p className="text-red-500 text-sm dark:text-red-400">{submitError}</p>
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    {t('contact.form.name')}
                  </label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder={t('contact.form.namePlaceholder')}
                    className={
                      form.formState.errors.name ? 'border-red-300 focus-visible:ring-red-200' : ''
                    }
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    {t('contact.form.email')}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder={t('contact.form.emailPlaceholder')}
                    className={
                      form.formState.errors.email ? 'border-red-300 focus-visible:ring-red-200' : ''
                    }
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  {t('contact.form.subject')}
                </label>
                <Input
                  id="subject"
                  {...form.register('subject')}
                  placeholder={t('contact.form.subjectPlaceholder')}
                  className={
                    form.formState.errors.subject ? 'border-red-300 focus-visible:ring-red-200' : ''
                  }
                  disabled={isSubmitting}
                />
                {form.formState.errors.subject && (
                  <p className="text-sm text-red-500">{form.formState.errors.subject.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  {t('contact.form.message')}
                </label>
                <Textarea
                  id="message"
                  {...form.register('message')}
                  placeholder={t('contact.form.messagePlaceholder')}
                  className={`min-h-[150px] ${
                    form.formState.errors.message ? 'border-red-300 focus-visible:ring-red-200' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {form.formState.errors.message && (
                  <p className="text-sm text-red-500">{form.formState.errors.message.message}</p>
                )}
              </div>
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t('contact.form.submitting')}
                  </span>
                ) : (
                  t('contact.form.submit')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
