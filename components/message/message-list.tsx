import React from 'react';
import { formatRelativeDate } from '@/utils/format';
import { MessageData } from '@/services/message';
import { 
  Archive, 
  Clock, 
  Eye, 
  Loader2,
  MailOpen, 
  MailX, 
  RotateCcw, 
  Trash 
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/utils/translation-context';
import Image from 'next/image';

interface MessageListActions {
  view: (id: string) => void;
  markAsRead?: (id: string) => void;
  markAsUnread?: (id: string) => void;
  archive?: (id: string) => void;
  unarchive?: (id: string) => void;
  delete: (id: string) => void;
}

interface MessageListProps {
  messages: MessageData[];
  actions: MessageListActions;
  type: 'sent' | 'received' | 'archived';
  processingIds?: string[]; // IDs de mensajes que están siendo procesados
}

export function MessageList({ messages, actions, type, processingIds = [] }: MessageListProps) {
  const { t } = useTranslation();
  
  // Determinar qué columnas mostrar según el tipo
  const showSender = type === 'received' || type === 'archived';
  const showRecipient = type === 'sent';
  const showReadStatus = type === 'received' || type === 'archived';
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">
            {t('messages.subject')}
          </TableHead>
          {showSender && (
            <TableHead>{t('messages.sender')}</TableHead>
          )}
          {showRecipient && (
            <TableHead>{t('messages.recipient')}</TableHead>
          )}
          <TableHead>{t('messages.listing')}</TableHead>
          <TableHead>{t('messages.date')}</TableHead>
          <TableHead className="text-right">{t('messages.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {messages.map((message) => (
          <TableRow 
            key={message.id}
            className={!message.readAt && type === 'received' ? 'font-medium bg-muted/30' : ''}
          >
            <TableCell 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => actions.view(message.id)}
            >
              {!message.readAt && type === 'received' && (
                <Badge variant="default" className="h-2 w-2 rounded-full p-0" />
              )}
              <span>
                {message.message === '[Mensaje eliminado]' 
                  ? <span className="italic text-muted-foreground">{t('messages.deleted_message') || 'Mensaje eliminado'}</span>
                  : message.subject || t('messages.no_subject')}
              </span>
            </TableCell>
            
            {showSender && (
              <TableCell>{message.senderName || message.senderId}</TableCell>
            )}
            
            {showRecipient && (
              <TableCell>{message.sellerName || message.sellerId}</TableCell>
            )}
            
            <TableCell>
              <div className="flex items-center gap-2">
                {message.listingImage && (
                  <div className="relative h-8 w-8 overflow-hidden rounded">
                    <Image 
                      src={message.listingImage} 
                      alt={message.listingTitle || t('messages.vehicle')}
                      className="object-cover"
                      fill
                      sizes="32px"
                    />
                  </div>
                )}
                <span className="truncate max-w-[120px]">
                  {message.listingTitle || t('messages.vehicle')}
                </span>
              </div>
            </TableCell>
            
            <TableCell>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Clock className="h-3 w-3" />
                <span>{formatRelativeDate(message.createdAt)}</span>
              </div>
            </TableCell>
            
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <TooltipProvider>
                  {/* Ver mensaje */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => actions.view(message.id)} 
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('messages.view_message')}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Marcar como leído/no leído */}
                  {showReadStatus && (
                    message.readAt 
                      ? actions.markAsUnread && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => actions.markAsUnread!(message.id)} 
                                disabled={processingIds.includes(message.id)}
                                className="h-8 w-8"
                              >
                                {processingIds.includes(message.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MailX className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('messages.mark_as_unread')}</p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      : actions.markAsRead && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => actions.markAsRead!(message.id)} 
                                disabled={processingIds.includes(message.id)}
                                className="h-8 w-8"
                              >
                                {processingIds.includes(message.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MailOpen className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('messages.mark_as_read')}</p>
                            </TooltipContent>
                          </Tooltip>
                        )
                  )}
                  
                  {/* Archivar/Desarchivar */}
                  {type === 'received' && actions.archive && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => actions.archive!(message.id)} 
                          disabled={processingIds.includes(message.id)}
                          className="h-8 w-8"
                        >
                          {processingIds.includes(message.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('messages.archive')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {type === 'archived' && actions.unarchive && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => actions.unarchive!(message.id)} 
                          disabled={processingIds.includes(message.id)}
                          className="h-8 w-8"
                        >
                          {processingIds.includes(message.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('messages.unarchive')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* Eliminar */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => actions.delete(message.id)} 
                        disabled={processingIds.includes(message.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        {processingIds.includes(message.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('messages.delete')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 