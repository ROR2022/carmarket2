'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Archive,
  Clock,
  Loader2,
  Mail,
  Reply,
  RotateCcw,
  Trash,
  User,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/utils/translation-context';
import { useAuth } from '@/utils/auth-hooks';
import { MessageData } from '@/services/message';
import { formatDate, formatRelativeDate } from '@/utils/format';
import { toast } from 'sonner';
import Image from 'next/image';
import axios from 'axios';

export default function MessageDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const messageId = params.id as string;

  // Estados
  const [message, setMessage] = useState<MessageData | null>(null);
  const [threadMessages, setThreadMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in?redirect=/messages');
    }
  }, [isAuthenticated, authLoading, router]);

  // Cargar mensaje
  useEffect(() => {
    const loadMessage = async () => {
      if (!messageId || !user) return;

      setLoading(true);
      try {
        // Cargar el mensaje
        //const messageData = await MessageService.getMessageById(messageId);
        const response = await axios.post(`/api/messages`,{
          methodSelected:"getMessageById",
          sentParams:{
            messageId:messageId
          }
        });
        const messageData = response.data;
        if (!messageData) {
          setError(t('messages.not_found'));
          setLoading(false);
          return;
        }

        setMessage(messageData);

        // Marcar como leído si es necesario
        if (!messageData.readAt && messageData.sellerId === user.id) {
          //await MessageService.markAsRead(messageId);
          await axios.post(`/api/messages`,{
            methodSelected:"markAsRead",
            sentParams:{
              messageId:messageId
            }
          });
        }

        // Cargar todos los mensajes del hilo si existe
        if (messageData.threadId) {
          //const thread = await MessageService.getMessageThread(messageData.threadId, user.id);
          const response = await axios.post(`/api/messages`,{
            methodSelected:"getMessageThread",
            sentParams:{
              messageId:messageId
            }
          });
          const thread = response.data;
          setThreadMessages(thread);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading message:', err);
        setError(t('messages.error_loading'));
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadMessage();
    }
  }, [messageId, user, t]);

  // Manejar envío de respuesta
  const handleSendReply = async () => {
    if (!message || !user || !replyText.trim() || replyText.length < 20) {
      toast.error(t('messages.reply_error'), {
        description: t('messages.reply_min_length'),
      });
      return;
    }

    setIsSending(true);
    try {
      /* const replyData = await MessageService.replyToMessage(
        message.id,
        { message: replyText.trim() },
        user.id,
      ); */
      const response = await axios.post(`/api/messages`,{
        methodSelected:"replyToMessage",
        sentParams:{
          originalMessageId:messageId,
          replyData:{
            message:replyText.trim()
          }
        }
      });

      const replyData= response.data;      

      // Actualizar la lista de mensajes del hilo
      if (replyData.threadId) {
        //const thread = await MessageService.getMessageThread(replyData.threadId, user.id);
        const response = await axios.post(`/api/messages`,{
          methodSelected:"getMessageThread",
          sentParams:{
            messageId:messageId
          }
        });
        const thread = response.data;
        setThreadMessages(thread);
      } else {
        setThreadMessages((prev) => [...prev, replyData]);
      }

      // Limpiar el campo de respuesta
      setReplyText('');

      toast.success(t('messages.reply_sent'), {
        description: t('messages.reply_success'),
      });
    } catch (err) {
      console.error('Error sending reply:', err);
      toast.error(t('messages.reply_error'), {
        description: t('messages.error_sending'),
      });
    } finally {
      setIsSending(false);
    }
  };

  // Manejar archivado/desarchivado
  const handleToggleArchive = async () => {
    if (!message || !user) return;

    try {
      if (message.isArchived) {
        //await MessageService.unarchiveMessage(message.id);
        await axios.post('/api/messages',{
          methodSelected:"unarchiveMessage",
          sentParams:{
            messageId:messageId
          }
        });

        setMessage((prev) => (prev ? { ...prev, isArchived: false } : null));
        toast.success(t('messages.unarchived'), {
          description: t('messages.unarchive_success'),
        });
      } else {
        //await MessageService.archiveMessage(message.id);
        await axios.post('/api/messages',{
          methodSelected:"archiveMessage",
          sentParams:{
            messageId:messageId
          }
        });
        setMessage((prev) => (prev ? { ...prev, isArchived: true } : null));
        toast.success(t('messages.archived'), {
          description: t('messages.archive_success'),
        });
      }
    } catch (err) {
      console.error('Error toggling archive:', err);
      toast.error(t('messages.error'), {
        description: t('messages.action_error'),
      });
    }
  };

  // Manejar eliminación
  const handleDelete = async () => {
    if (!message) return;

    if (!confirm(t('messages.delete_confirm'))) {
      return;
    }

    setIsDeleting(true);
    try {
      //await MessageService.deleteMessage(message.id); 
      // ----aqui puede ser que falte el deleteRelated
      await axios.post('/api/messages',{
        methodSelected:"deleteMessage",
        sentParams:{
          messageId:messageId
        }
      });
      toast.success(t('messages.deleted'), {
        description: t('messages.delete_success'),
      });
      // Regresar a la bandeja de entrada
      router.push('/messages');
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error(t('messages.error'), {
        description: t('messages.delete_error'),
      });
      setIsDeleting(false);
    }
  };

  // Mostrar cargando si la autenticación está en proceso
  if (authLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (efecto se encargará de redireccionar)
  if (!isAuthenticated) {
    return null;
  }

  // Mostrar pantalla de carga o error
  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('messages.loading')}</span>
        </div>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center h-96">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('messages.not_found_title')}</h2>
          <p className="text-muted-foreground mb-6">{error || t('messages.not_found')}</p>
          <Button asChild>
            <Link href="/messages">{t('messages.back_to_inbox')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Determinar si el usuario es el remitente o el destinatario
  const _isSender = user && message.senderId === user.id;
  const isRecipient = user && message.sellerId === user.id;

  // Obtener los mensajes ordenados por fecha (el más antiguo primero)
  const sortedThreadMessages =
    threadMessages.length > 0
      ? [...threadMessages].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
      : [message];

  return (
    <div className="container py-10">
      {/* Encabezado con acciones */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/messages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {message.subject || t('messages.no_subject')}
            </h1>
            <p className="text-muted-foreground">
              {isRecipient
                ? `${t('messages.from_user')} ${message.senderName || message.senderId}`
                : `${t('messages.to_user')} ${message.sellerName || message.sellerId}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Botón de archivar/desarchivar (solo para destinatario) */}
          {isRecipient && (
            <Button variant="outline" size="sm" onClick={handleToggleArchive} className="gap-2">
              {message.isArchived ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  {t('messages.unarchive')}
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  {t('messages.archive')}
                </>
              )}
            </Button>
          )}

          {/* Botón de eliminar */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
            {t('messages.delete')}
          </Button>
        </div>
      </div>

      {/* Información del vehículo */}
      {message.listingTitle && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t('messages.about_listing')}</CardTitle>
            <CardDescription>{t('messages.listing_info')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {message.listingImage && (
                <div className="relative h-16 w-24 overflow-hidden rounded-md">
                  <Image
                    src={message.listingImage}
                    alt={message.listingTitle}
                    fill
                    sizes="(max-width: 768px) 96px, 96px"
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="font-medium">{message.listingTitle}</h3>
                <Button variant="link" asChild className="p-0 h-auto text-sm">
                  <Link href={`/cars/${message.listingId}`}>{t('messages.view_listing')}</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hilo de mensajes */}
      <div className="space-y-6 mb-8">
        {sortedThreadMessages.map((msg, index) => {
          const isUserSender = user && msg.senderId === user.id;

          return (
            <Card key={msg.id} className={isUserSender ? 'border-primary/20 bg-primary/5' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="bg-muted rounded-full h-8 w-8 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {isUserSender ? t('messages.you') : msg.senderName || msg.senderId}
                      </CardTitle>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        <time dateTime={msg.createdAt} title={formatDate(msg.createdAt)}>
                          {formatRelativeDate(msg.createdAt)}
                        </time>
                      </div>
                    </div>
                  </div>

                  {index === 0 && <Badge variant="outline">{t('messages.original_message')}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">{msg.message}</div>
                {msg.includePhone && (
                  <div className="mt-4 text-sm">
                    <span className="font-medium">{t('messages.phone_number')}:</span>{' '}
                    {msg.senderPhone}
                  </div>
                )}
              </CardContent>
              {index === sortedThreadMessages.length - 1 && isRecipient && !msg.readAt && (
                <CardFooter className="pt-0">
                  <Badge variant="secondary">{t('messages.new_message')}</Badge>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>

      {/* Formulario de respuesta */}
      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('messages.reply')}</CardTitle>
          <CardDescription>{t('messages.reply_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t('messages.reply_placeholder')}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {`${t('messages.min_characters')} ${20}`}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="default"
            onClick={handleSendReply}
            disabled={isSending || replyText.trim().length < 20}
            className="gap-2"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Reply className="h-4 w-4" />
            )}
            {t('messages.send_reply')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setReplyText('')}
            disabled={isSending || replyText.length === 0}
          >
            {t('messages.clear')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
