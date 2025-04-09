"use client"
import React, { useState } from 'react';
import { MessageData } from '@/services/message';
import { useTranslation } from '@/utils/translation-context';
import { formatDate, formatRelativeDate } from '@/utils/format';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Loader2, 
  Reply, 
  User, 
  ArrowLeft 
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import axios from 'axios';

interface ConversationViewProps {
  messages: MessageData[];
  currentUserId: string;
  onBack: () => void;
  onRefresh: () => void;
}

export function ConversationView({ 
  messages, 
  currentUserId, 
  onBack, 
  onRefresh 
}: ConversationViewProps) {
  const { t } = useTranslation();
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // No mostrar nada si no hay mensajes
  if (!messages.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">{t('messages.no_messages')}</h3>
        <Button onClick={onBack}>{t('messages.back')}</Button>
      </div>
    );
  }
  
  // Obtener información del primer mensaje para mostrar detalles del vehículo
  const firstMessage = messages[0];
  
  // Ordenar mensajes por fecha (más antiguo primero)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  // Manejar envío de respuesta
  const handleSendReply = async () => {
    if (!firstMessage || !currentUserId || !replyText.trim() || replyText.length < 20) {
      toast.error(t('messages.reply_error'), {
        description: t('messages.reply_min_length'),
      });
      return;
    }

    setIsSending(true);
    try {
      // Encontrar el ID del último mensaje para responder
      const lastMessageId = sortedMessages[sortedMessages.length - 1].id;
      
      //aqui es donde se envia el mensaje de respuesta
      /* await MessageService.replyToMessage(
        lastMessageId,
        { message: replyText.trim() },
        currentUserId,
      ); */

      const response = await axios.post('/api/messages', {
        methodSelected: 'replyToMessage',
        sentParams: {
          originalMessageId: lastMessageId,
          replyData: { message: replyText.trim() },
          senderId: currentUserId
        }
      });

      console.log(response.data);
      

      // Limpiar el campo de respuesta
      setReplyText('');
      
      // Actualizar la conversación
      onRefresh();

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
  
  return (
    <div className="space-y-6">
      {/* Encabezado con botón de regresar y título */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">
            {firstMessage.subject || t('messages.no_subject')}
          </h2>
        </div>
      </div>
      
      {/* Información del vehículo */}
      {firstMessage.listingTitle && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('messages.about_listing')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {firstMessage.listingImage && (
                <div className="relative h-16 w-24 overflow-hidden rounded-md">
                  <Image
                    src={firstMessage.listingImage}
                    alt={firstMessage.listingTitle}
                    fill
                    sizes="(max-width: 768px) 96px, 96px"
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="font-medium">{firstMessage.listingTitle}</h3>
                <Button variant="link" asChild className="p-0 h-auto text-sm">
                  <a href={`/cars/${firstMessage.listingId}`} target="_blank" rel="noopener noreferrer">
                    {t('messages.view_listing')}
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Mensajes de la conversación */}
      <div className="space-y-6">
        {sortedMessages.map((msg, index) => {
          const isUserSender = currentUserId && msg.senderId === currentUserId;
          
          return (
            <Card 
              key={msg.id} 
              className={isUserSender ? 'border-primary/20 bg-primary/5 ml-12' : 'mr-12'}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="bg-muted rounded-full h-8 w-8 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {isUserSender ? t('messages.you') : (msg.senderName || msg.senderId)}
                      </CardTitle>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        <time dateTime={msg.createdAt} title={formatDate(msg.createdAt)}>
                          {formatRelativeDate(msg.createdAt)}
                        </time>
                      </div>
                    </div>
                  </div>
                  
                  {index === 0 && (
                    <Badge variant="outline">{t('messages.original_message')}</Badge>
                  )}
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
            </Card>
          );
        })}
      </div>
      
      {/* Formulario de respuesta */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">{t('messages.reply')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t('messages.reply_placeholder')}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
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