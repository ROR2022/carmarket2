import React from 'react';
import { MessageData } from '@/services/message';
import { useTranslation } from '@/utils/translation-context';
import { formatRelativeDate } from '@/utils/format';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, ArrowRight, Mail, MessageSquare, Trash } from 'lucide-react';
import Image from 'next/image';

interface ConversationListProps {
  conversations: Record<string, MessageData[]>;
  userId: string;
  onSelectConversation: (threadId: string) => void;
  onArchiveConversation: (threadId: string) => void;
  onDeleteConversation: (threadId: string) => void;
}

export function ConversationList({
  conversations,
  userId,
  onSelectConversation,
  onArchiveConversation,
  onDeleteConversation
}: ConversationListProps) {
  const { t } = useTranslation();
  
  // Ordenar conversaciones por fecha del mensaje más reciente (descendente)
  const sortedThreadIds = Object.keys(conversations).sort((a, b) => {
    const aMessages = conversations[a];
    const bMessages = conversations[b];
    
    const aLatestDate = new Date(aMessages[aMessages.length - 1].createdAt).getTime();
    const bLatestDate = new Date(bMessages[bMessages.length - 1].createdAt).getTime();
    
    return bLatestDate - aLatestDate; // Orden descendente
  });
  
  if (sortedThreadIds.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">{t('messages.no_conversations')}</h3>
        <p className="text-muted-foreground">{t('messages.start_conversation')}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {sortedThreadIds.map(threadId => {
        const thread = conversations[threadId];
        
        // Obtener el último mensaje de la conversación
        const lastMessage = thread[thread.length - 1];
        
        // Determinar si hay mensajes no leídos en esta conversación
        const hasUnread = thread.some(msg => {
          // Mensaje no leído dirigido al usuario (tanto como vendedor o como comprador)
          return (
            // Mensaje dirigido al usuario como vendedor
            (msg.sellerId === userId && msg.senderId !== userId && msg.readAt === null) ||
            // Mensaje dirigido al usuario como comprador (mensaje al que respondió el vendedor)
            (msg.senderId !== userId && msg.sellerId !== userId && msg.readAt === null)
          );
        });
        
        // Obtener información del otro participante (vendedor o comprador)
        const isUserSeller = lastMessage.sellerId === userId;
        const otherParticipantId = isUserSeller ? lastMessage.senderId : lastMessage.sellerId;
        
        // Obtener un resumen del último mensaje (primeros 80 caracteres)
        const messageSummary = lastMessage.message.length > 80
          ? `${lastMessage.message.substring(0, 80)}...`
          : lastMessage.message;
        
        return (
          <Card 
            key={threadId}
            className={`cursor-pointer transition-all hover:shadow ${hasUnread ? 'border-primary' : ''}`}
            onClick={() => onSelectConversation(threadId)}
          >
            <CardContent className="pt-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-secondary/50 rounded-full h-10 w-10 flex items-center justify-center">
                    {isUserSeller ? (
                      <Mail className="h-5 w-5" />
                    ) : (
                      <ArrowRight className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {isUserSeller ? t('messages.from_buyer') : t('messages.to_seller')}
                    </h3>
                    <p className="text-sm text-muted-foreground">{otherParticipantId}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeDate(lastMessage.createdAt)}
                  </span>
                  {hasUnread && (
                    <Badge variant="default" className="ml-2">
                      {t('messages.unread')}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <p className="font-medium">{lastMessage.subject || t('messages.no_subject')}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{messageSummary}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {lastMessage.listingImage && (
                  <div className="relative h-12 w-16 overflow-hidden rounded">
                    <Image 
                      src={lastMessage.listingImage} 
                      alt={lastMessage.listingTitle || t('messages.vehicle')}
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 100vw, 64px"
                    />
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium">
                    {lastMessage.listingTitle || t('messages.vehicle')}
                  </span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end gap-2 py-2 bg-muted/20">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onArchiveConversation(threadId);
                }}
              >
                <Archive className="h-4 w-4 mr-1" />
                {t('messages.archive')}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(threadId);
                }}
              >
                <Trash className="h-4 w-4 mr-1" />
                {t('messages.delete')}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
} 