'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Inbox, 
  Send, 
  Archive, 
  Loader2, 
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { useTranslation } from '@/utils/translation-context';
import { useAuth } from '@/utils/auth-hooks';
import { MessageData } from '@/services/message';
//import { formatRelativeDate } from '@/utils/format';
import { MessageList } from '@/components/message/message-list';
import { EmptyState } from '@/components/message/empty-state';
import { ConversationList } from '@/components/message/conversation-list';
import { ConversationView } from '@/components/message/conversation-view';
import { toast } from 'sonner';
import axios from 'axios';

export default function MessagesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  // Estados para la vista tradicional de mensajes
  const [activeTab, setActiveTab] = useState('inbox');
  const [receivedMessages, setReceivedMessages] = useState<MessageData[]>([]);
  const [sentMessages, setSentMessages] = useState<MessageData[]>([]);
  const [archivedMessages, setArchivedMessages] = useState<MessageData[]>([]);
  
  // Estados para la vista de conversaciones
  const [conversations, setConversations] = useState<Record<string, MessageData[]>>({});
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'traditional' | 'conversations'>('conversations');
  
  // Estados comunes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  
  // Referencia para controlar si los mensajes ya se cargaron inicialmente
  const initialLoadRef = React.useRef(false);
  
  // Redireccionar si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in?redirect=/messages');
    }
  }, [isAuthenticated, authLoading, router]);

  const getReceivedMessages = async (userId: string) => {
    const response = await axios.post('/api/messages', {
      methodSelected: 'getReceivedMessages',
      sentParams: {
        userId: userId
      }
    });
    return response.data;
  }

  const getSentMessages = async (userId: string) => {
    const response = await axios.post('/api/messages', {
      methodSelected: 'getSentMessages',
      sentParams: {
        userId: userId
      }
    });
    return response.data;
  }
  
  const getArchivedMessages = async (userId: string) => {
    const response = await axios.post('/api/messages', {
      methodSelected: 'getArchivedMessages',
      sentParams: {
        userId: userId
      }
    });
    return response.data;
  }

  const getUnreadMessageCount = async (userId: string) => {
    const response = await axios.post('/api/messages', {
      methodSelected: 'getUnreadMessageCount',
      sentParams: {
        userId: userId
      }
    });
    return response.data;
  }

  const getConversations = async (userId: string) => {
    const response = await axios.post('/api/messages', {
      methodSelected: 'getConversations',
      sentParams: {
        userId: userId
      }
    });
    return response.data;
  }

  const archiveMessage = async (messageId: string) => {
    const response = await axios.post('/api/messages', {
      methodSelected: 'archiveMessage',
      sentParams: {
        messageId: messageId
      }
    });
    return response.data;
  }

  const deleteMessage = async (messageId: string, deleteRelated?: boolean) => {
    const response = await axios.post('/api/messages', {
      methodSelected: 'deleteMessage',
      sentParams: {
        messageId: messageId,
        deleteRelated: deleteRelated
      }
    });
    return response.data;
  }

  const markAsRead = async (messageId: string) => {
    const response = await axios.post('/api/messages', {
      methodSelected: 'markAsRead',
      sentParams: {
        messageId: messageId
      }
    });
    return response.data;
  }

  const markAsUnread = async (messageId: string) => {
    const response = await axios.post('/api/messages', {
      methodSelected: 'markAsUnread',
      sentParams: {
        messageId: messageId
      }
    });
    return response.data;
  }

  const unarchiveMessage = async (messageId: string) => {
    const response = await axios.post('/api/messages', {
      methodSelected: 'unarchiveMessage',
      sentParams: {
        messageId: messageId
      }
    });
    return response.data;
  }

  

  // Cargar mensajes cuando el usuario esté disponible y no esté cargando
  useEffect(() => {
    const loadMessages = async () => {
      // No cargar si:
      // 1. No hay usuario
      // 2. El usuario aún está cargando
      // 3. Ya cargamos los mensajes y no estamos refrescando explícitamente
      if (!user || authLoading || (initialLoadRef.current && !refreshing)) {
        return;
      }
      
      /**
       * MessageService.getReceivedMessages(user.id),
            MessageService.getSentMessages(user.id),
            MessageService.getArchivedMessages(user.id),
            MessageService.getUnreadMessageCount(user.id)
       */
      setLoading(true);
      try {
        console.log('Cargando mensajes para el usuario:', user.id);
        if (viewMode === 'traditional') {
          // Cargar contenido con Promise.all para optimizar
          const [received, sent, archived, count] = await Promise.all([
            getReceivedMessages(user.id),
            getSentMessages(user.id),
            getArchivedMessages(user.id),
            getUnreadMessageCount(user.id)
          ]);
          
          setReceivedMessages(received);
          setSentMessages(sent);
          setArchivedMessages(archived);
          setUnreadCount(count);
        } else {
          // Carga de conversaciones agrupadas
          const { conversations: convos, unreadCount: unread } = await getConversations(user.id);
          setConversations(convos);
          setUnreadCount(unread);
        }
        
        setError(null);
        
        // Marcar que ya se realizó la carga inicial
        initialLoadRef.current = true;
      } catch (err) {
        console.error('Error cargando mensajes:', err);
        setError(t('messages.error_loading'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    loadMessages();
  }, [user, authLoading, t, refreshing, viewMode]);
  
  // Función para refrescar mensajes manualmente
  const handleRefresh = async () => {
    if (!user) return;
    
    // Reiniciar estado para forzar recarga
    setRefreshing(true);
    initialLoadRef.current = false;
  };
  
  // Función para cambiar entre modos de vista
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'traditional' ? 'conversations' : 'traditional');
    setSelectedThread(null);
    initialLoadRef.current = false; // Forzar recarga al cambiar de modo
  };
  
  // Manejar selección de conversación
  const handleSelectConversation = (threadId: string) => {
    setSelectedThread(threadId);
  };
  
  // Manejar acción de archivar conversación
  const handleArchiveConversation = async (threadId: string) => {
    if (!user || !conversations[threadId] || !conversations[threadId].length) return;
    
    try {
      // Archivar todos los mensajes de la conversación
      for (const message of conversations[threadId]) {
        if (message.sellerId === user.id && !message.isArchived) {
          await archiveMessage(message.id);
        }
      }
      
      // Actualizar la UI
      setConversations(prev => {
        const newConversations = { ...prev };
        delete newConversations[threadId];
        return newConversations;
      });
      
      toast.success(t('messages.archived'), {
        description: t('messages.conversation_archived'),
      });
    } catch (err) {
      console.error('Error archiving conversation:', err);
      toast.error(t('messages.error'), {
        description: t('messages.action_error'),
      });
    }
  };
  
  // Manejar acción de eliminar conversación
  const handleDeleteConversation = async (threadId: string) => {
    if (!user || !conversations[threadId] || !conversations[threadId].length) return;
    
    if (!confirm(t('messages.delete_conversation_confirm'))) {
      return;
    }
    
    try {
      // Eliminar todos los mensajes de la conversación
      for (const message of conversations[threadId]) {
        await deleteMessage(message.id);
      }
      
      // Actualizar la UI
      setConversations(prev => {
        const newConversations = { ...prev };
        delete newConversations[threadId];
        return newConversations;
      });
      
      toast.success(t('messages.deleted'), {
        description: t('messages.conversation_deleted'),
      });
      
      // Si estamos viendo esta conversación, volver a la lista
      if (selectedThread === threadId) {
        setSelectedThread(null);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      toast.error(t('messages.error'), {
        description: t('messages.delete_error'),
      });
    }
  };
  
  // Acciones tradicionales de mensajes
  const handleMarkAsRead = async (messageId: string) => {
    try {
      setProcessingIds(prev => [...prev, messageId]);
      
      await markAsRead(messageId);
      
      // Actualizar la lista de mensajes recibidos
      setReceivedMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, readAt: new Date().toISOString() } 
            : msg
        )
      );
      
      // Actualizar contador de no leídos
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marcando mensaje como leído:', error);
      toast.error(t('messages.error'), {
        description: t('messages.action_error'),
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== messageId));
    }
  };
  
  const handleMarkAsUnread = async (messageId: string) => {
    try {
      setProcessingIds(prev => [...prev, messageId]);
      
      await markAsUnread(messageId);
      
      // Actualizar la lista de mensajes
      setReceivedMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, readAt: null } 
            : msg
        )
      );
      
      // Actualizar contador de no leídos
      setUnreadCount(prev => prev + 1);
      
      toast.success(t('messages.updated'), {
        description: t('messages.mark_as_unread_success'),
      });
    } catch (error) {
      console.error('Error marcando mensaje como no leído:', error);
      toast.error(t('messages.error'), {
        description: t('messages.action_error'),
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== messageId));
    }
  };
  
  const handleArchive = async (messageId: string) => {
    try {
      setProcessingIds(prev => [...prev, messageId]);
      
      await archiveMessage(messageId);
      
      // Mover el mensaje de recibidos a archivados
      const messageToArchive = receivedMessages.find(msg => msg.id === messageId);
      if (messageToArchive) {
        setReceivedMessages(prev => prev.filter(msg => msg.id !== messageId));
        setArchivedMessages(prev => [{ ...messageToArchive, isArchived: true }, ...prev]);
      }
      
      toast.success(t('messages.archived'), {
        description: t('messages.archive_success'),
      });
    } catch (error) {
      console.error('Error archivando mensaje:', error);
      toast.error(t('messages.error'), {
        description: t('messages.action_error'),
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== messageId));
    }
  };
  
  const handleUnarchive = async (messageId: string) => {
    try {
      setProcessingIds(prev => [...prev, messageId]);
      
      await unarchiveMessage(messageId);
      
      // Mover el mensaje de archivados a recibidos
      const messageToUnarchive = archivedMessages.find(msg => msg.id === messageId);
      if (messageToUnarchive) {
        setArchivedMessages(prev => prev.filter(msg => msg.id !== messageId));
        setReceivedMessages(prev => [{ ...messageToUnarchive, isArchived: false }, ...prev]);
      }
      
      toast.success(t('messages.unarchived'), {
        description: t('messages.unarchive_success'),
      });
    } catch (error) {
      console.error('Error desarchivando mensaje:', error);
      toast.error(t('messages.error'), {
        description: t('messages.action_error'),
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== messageId));
    }
  };
  
  /**
   * Eliminar un mensaje
   */
  const handleDelete = async (messageId: string) => {
    try {
      setProcessingIds(prev => [...prev, messageId]);
      
      // Primero, preguntar al usuario si quiere eliminar el mensaje
      const confirmDelete = confirm(t('messages.delete_confirm'));
      if (!confirmDelete) {
        setProcessingIds(prev => prev.filter(id => id !== messageId));
        return;
      }
      
      try {
        // Intentar primero sin eliminar mensajes relacionados
        await deleteMessage(messageId, false);
      } catch (error: unknown) {
        // Si falla debido a dependencias, preguntar si quiere eliminar todo
        if (error instanceof Error && 
            (error.message.includes('tiene dependencias') || 
             error.message.includes('dependen de él'))) {
          
          const confirmDeleteAll = confirm(
            t('messages.delete_with_related_confirm') || 
            'Este mensaje tiene respuestas asociadas. ¿Desea eliminar también todos los mensajes relacionados? Esta acción no se puede deshacer.'
          );
          
          if (!confirmDeleteAll) {
            setProcessingIds(prev => prev.filter(id => id !== messageId));
            throw new Error('Operación cancelada por el usuario');
          }
          
          // Intentar de nuevo con deleteRelated=true
          await deleteMessage(messageId, true);
        } else {
          // Si es otro tipo de error, propagarlo
          throw error;
        }
      }
      
      // Actualizar las listas de mensajes eliminando el mensaje borrado
      setReceivedMessages(prev => prev.filter(msg => msg.id !== messageId));
      setSentMessages(prev => prev.filter(msg => msg.id !== messageId));
      setArchivedMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Actualizar contador de mensajes no leídos si el mensaje eliminado estaba sin leer
      if (receivedMessages.find(msg => msg.id === messageId && msg.readAt === null)) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success(t('messages.deleted'), {
        description: t('messages.delete_success'),
      });
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      
      // Si el usuario canceló la operación, no mostrar toast de error
      if (error instanceof Error && error.message === 'Operación cancelada por el usuario') {
        return;
      }
      
      // Extraer y mostrar un mensaje de error más descriptivo
      let errorMessage = t('messages.delete_error');
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(t('messages.error'), {
        description: errorMessage,
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== messageId));
    }
  };
  
  // Manejar clic en mensaje para ver detalles
  const handleViewMessage = (messageId: string) => {
    router.push(`/messages/${messageId}`);
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
  
  return (
    <div className="container py-10">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('messages.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('messages.description')}</p>
          </div>
          
          <Button variant="outline" onClick={toggleViewMode}>
            {viewMode === 'traditional' 
              ? t('messages.view_as_conversations')
              : t('messages.view_as_traditional')
            }
          </Button>
        </div>
      </div>
      
      {viewMode === 'traditional' ? (
        // VISTA TRADICIONAL DE MENSAJES
        <Tabs 
          defaultValue="inbox" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="inbox" className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                <span>{t('messages.inbox')}</span>
                {unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                <span>{t('messages.sent')}</span>
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                <span>{t('messages.archived')}</span>
              </TabsTrigger>
            </TabsList>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={refreshing || loading}
              className="flex items-center gap-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{t('messages.refresh')}</span>
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'inbox' && t('messages.inbox')}
                {activeTab === 'sent' && t('messages.sent')}
                {activeTab === 'archived' && t('messages.archived')}
              </CardTitle>
              <CardDescription>
                {activeTab === 'inbox' && t('messages.inbox_description')}
                {activeTab === 'sent' && t('messages.sent_description')}
                {activeTab === 'archived' && t('messages.archived_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-10">
                  <p className="text-destructive">{error}</p>
                  <Button onClick={handleRefresh} variant="outline" className="mt-4">
                    {t('messages.try_again')}
                  </Button>
                </div>
              ) : (
                <>
                  <TabsContent value="inbox" className="mt-0">
                    {receivedMessages.length === 0 ? (
                      <EmptyState 
                        icon={<Inbox className="h-12 w-12" />}
                        title={t('messages.empty_inbox_title')}
                        description={t('messages.empty_inbox_description')}
                      />
                    ) : (
                      <MessageList
                        messages={receivedMessages}
                        actions={{
                          view: handleViewMessage,
                          markAsRead: handleMarkAsRead,
                          markAsUnread: handleMarkAsUnread,
                          archive: handleArchive,
                          delete: handleDelete
                        }}
                        type="received"
                        processingIds={processingIds}
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="sent" className="mt-0">
                    {sentMessages.length === 0 ? (
                      <EmptyState
                        icon={<Send className="h-12 w-12" />}
                        title={t('messages.empty_sent_title')}
                        description={t('messages.empty_sent_description')}
                      />
                    ) : (
                      <MessageList
                        messages={sentMessages}
                        actions={{
                          view: handleViewMessage,
                          delete: handleDelete
                        }}
                        type="sent"
                        processingIds={processingIds}
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="archived" className="mt-0">
                    {archivedMessages.length === 0 ? (
                      <EmptyState
                        icon={<Archive className="h-12 w-12" />}
                        title={t('messages.empty_archived_title')}
                        description={t('messages.empty_archived_description')}
                      />
                    ) : (
                      <MessageList
                        messages={archivedMessages}
                        actions={{
                          view: handleViewMessage,
                          unarchive: handleUnarchive,
                          delete: handleDelete
                        }}
                        type="archived"
                        processingIds={processingIds}
                      />
                    )}
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Card>
        </Tabs>
      ) : (
        // VISTA DE CONVERSACIONES
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('messages.conversations')}</CardTitle>
                <CardDescription>{t('messages.conversations_description')}</CardDescription>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={refreshing || loading}
                className="flex items-center gap-2"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>{t('messages.refresh')}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <p className="text-destructive">{error}</p>
                <Button onClick={handleRefresh} variant="outline" className="mt-4">
                  {t('messages.try_again')}
                </Button>
              </div>
            ) : (
              <>
                {!selectedThread ? (
                  // Lista de conversaciones
                  Object.keys(conversations).length === 0 ? (
                    <EmptyState 
                      icon={<MessageSquare className="h-12 w-12" />}
                      title={t('messages.no_conversations')}
                      description={t('messages.start_conversation_description')}
                    />
                  ) : (
                    <ConversationList
                      conversations={conversations}
                      userId={user!.id}
                      onSelectConversation={handleSelectConversation}
                      onArchiveConversation={handleArchiveConversation}
                      onDeleteConversation={handleDeleteConversation}
                    />
                  )
                ) : (
                  // Vista de conversación seleccionada
                  <ConversationView
                    messages={conversations[selectedThread] || []}
                    currentUserId={user!.id}
                    onBack={() => setSelectedThread(null)}
                    onRefresh={handleRefresh}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 