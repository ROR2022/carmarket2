import { createClient } from '@/utils/supabase/server';
import { ContactMessageData } from '@/components/car/contact-seller-dialog';
import { CatalogService } from './catalog';
import { v4 as uuidv4 } from 'uuid';


/**
 * Representa un mensaje tal como viene de la base de datos de Supabase
 */
interface DbMessageWithRelations {
  id: string;
  listing_id: string;
  seller_id: string;
  sender_id: string;
  subject: string;
  message: string;
  include_phone: boolean;
  created_at: string;
  read_at: string | null;
  is_archived: boolean;
  is_deleted: boolean;
  parent_message_id: string | null;
  thread_id: string | null;
  listings?: {
    id: string;
    title: string;
  };
  // En la versión modificada para arreglar el problema con getConversations,
  // estas propiedades ya no vendrán de las relaciones en Supabase
  sender?: {
    id: string;
    email?: string;
    full_name?: string;
    phone?: string;
  };
  seller?: {
    id: string;
    email?: string;
    full_name?: string;
    phone?: string;
  };
}

export interface MessageData {
  id: string;
  listingId: string;
  sellerId: string;
  senderId: string;
  subject: string;
  message: string;
  includePhone: boolean;
  createdAt: string;
  readAt: string | null;
  isArchived?: boolean;
  parentMessageId?: string | null;
  threadId?: string | null;
  
  // Campos opcionales para UI
  listingTitle?: string;
  listingImage?: string;
  senderName?: string;
  sellerName?: string;
  senderPhone?: string;
}

export const MessageService = {
  /**
   * Envía un mensaje al vendedor de un anuncio
   */
  async sendContactMessage(
    listingId: string,
    sellerId: string,
    data: ContactMessageData,
    senderId: string
  ): Promise<{ message: string }> {
    const supabase = await createClient();
    
    // Generar un UUID para el mensaje que también servirá como threadId
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        listing_id: listingId,
        seller_id: sellerId,
        sender_id: senderId,
        subject: data.subject,
        message: data.message,
        include_phone: data.includePhone,
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Error sending message:', insertError);
      throw new Error('Error al enviar el mensaje: ' + insertError.message);
    }
    
    // Actualizar el mensaje para establecer su propio ID como threadId
    const { error: updateError } = await supabase
      .from('messages')
      .update({ thread_id: newMessage.id })
      .eq('id', newMessage.id);
    
    if (updateError) {
      console.error('Error setting thread ID:', updateError);
      // No lanzamos error aquí para no interrumpir el flujo principal
    }
    
    // Incrementar el contador de contactos del anuncio
    try {
      await CatalogService.incrementContactCount(listingId);
    } catch (err) {
      // No hacemos fallar la operación principal si falla el incremento,
      // solo lo registramos para solucionar después
      console.error('Error incrementing contact count:', err);
    }

    return { message: 'Mensaje enviado correctamente' };
  },
  
  /**
   * Obtiene los mensajes enviados por un usuario
   */
  async getSentMessages(userId: string): Promise<MessageData[]> {
    const supabase = await createClient();
    
    // 1. Obtener todos los mensajes enviados por el usuario
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        listings(id, title)
      `)
      .eq('sender_id', userId)
      .eq('is_archived', false)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting sent messages:', error);
      throw new Error('Error al obtener mensajes enviados: ' + error.message);
    }
    
    // 2. Obtener los IDs de los hilos de los mensajes enviados
    const threadIds = data
      ?.map(msg => msg.thread_id)
      .filter(id => id !== null && id !== undefined) || [];
    
    // 3. Obtener respuestas a los mensajes enviados (mensajes en los mismos hilos)
    let threadReplies: DbMessageWithRelations[] = [];
    if (threadIds.length > 0) {
      // Obtenemos TODOS los mensajes del hilo sin filtrar por sender_id
      // De esta forma, si el vendedor responde, el comprador verá la respuesta
      const { data: replies, error: repliesError } = await supabase
        .from('messages')
        .select(`
          *,
          listings(id, title)
        `)
        .in('thread_id', threadIds)
        // Ya no filtramos por sender_id para ver TODOS los mensajes del hilo
        .eq('is_deleted', false)  // No están eliminados
        .order('created_at', { ascending: false });
      
      if (repliesError) {
        console.error('Error getting thread replies:', repliesError);
      } else {
        threadReplies = replies || [];
      }
    }
    
    // 4. Combinar mensajes enviados y respuestas recibidas
    const allMessages = [...(data || []), ...threadReplies];
    
    // 5. Eliminar duplicados basados en el ID del mensaje
    const uniqueMessages = allMessages.filter((message, index, self) => 
      index === self.findIndex(m => m.id === message.id)
    );
    
    // 6. Obtener las imágenes para los listings
    const listingIds = uniqueMessages.map(msg => msg.listing_id);
    const { data: images, error: imagesError } = await supabase
      .from('listing_images')
      .select('listing_id, url')
      .in('listing_id', listingIds)
      .eq('is_primary', true)
      .order('display_order', { ascending: true });
    
    if (imagesError) {
      console.error('Error fetching listing images:', imagesError);
    }
    
    // Crear un mapa de listing_id -> primera imagen
    const imagesByListingId: Record<string, string> = {};
    if (images && images.length > 0) {
      images.forEach(img => {
        if (!imagesByListingId[img.listing_id]) {
          imagesByListingId[img.listing_id] = img.url;
        }
      });
    }
    
    return uniqueMessages.map(msg => ({
      id: msg.id,
      listingId: msg.listing_id,
      sellerId: msg.seller_id,
      senderId: msg.sender_id,
      subject: msg.subject,
      message: msg.message,
      includePhone: msg.include_phone,
      createdAt: msg.created_at,
      readAt: msg.read_at,
      isArchived: msg.is_archived,
      parentMessageId: msg.parent_message_id,
      threadId: msg.thread_id,
      listingTitle: msg.listings?.title || '',
      listingImage: imagesByListingId[msg.listing_id] || '',
    }));
  },
  
  /**
   * Obtiene los mensajes recibidos por un usuario, incluyendo:
   * 1. Mensajes donde el usuario es vendedor (recibidos directamente)
   * 2. Respuestas en hilos donde el usuario participó como comprador
   */
  async getReceivedMessages(userId: string): Promise<MessageData[]> {
    const supabase = await createClient();
    
    console.log(`[DEBUG getReceivedMessages] Obteniendo mensajes recibidos para usuario: ${userId}`);
    
    // 1. Obtener mensajes donde el usuario es vendedor (recibidos directamente)
    // Sin utilizar join implícito para evitar el error
    const { data: receivedAsSeller, error: receivedError } = await supabase
      .from('messages')
      .select(`
        *,
        listings(id, title)
      `)
      .eq('seller_id', userId)   // Usuario es el vendedor
      .neq('sender_id', userId)  // No fue enviado por el usuario (es un mensaje recibido)
      .eq('is_archived', false)  // No está archivado
      .eq('is_deleted', false)   // No está eliminado
      .order('created_at', { ascending: false });
    
    if (receivedError) {
      console.error('Error getting received messages:', receivedError);
      throw new Error('Error al obtener mensajes recibidos: ' + receivedError.message);
    }
    
    console.log(`[DEBUG getReceivedMessages] Recibidos como vendedor: ${receivedAsSeller?.length || 0} mensajes`);
    
    // 2. Obtener mensajes enviados por el usuario (como comprador) para identificar hilos
    const { data: sentMessages, error: sentError } = await supabase
      .from('messages')
      .select(`
        id, thread_id, seller_id, listing_id, sender_id,
        listings(id, title)
      `)
      .eq('sender_id', userId)      // Enviados por el usuario
      .eq('is_deleted', false)      // No está eliminado
      .order('created_at', { ascending: false });
    
    if (sentError) {
      console.error('Error getting threads initiated by user:', sentError);
      throw new Error('Error al obtener hilos iniciados por usuario: ' + sentError.message);
    }
    
    console.log(`[DEBUG getReceivedMessages] Mensajes enviados por el usuario: ${sentMessages?.length || 0}`);
    
    // Extraer todos los thread_ids únicos
    // 1. De mensajes con thread_id explícito
    // 2. De mensajes que podrían ser el inicio de un hilo (su propio ID sería el thread_id)
    const threadIds = new Set<string>();
    
    sentMessages?.forEach(msg => {
      // Si tiene thread_id, usar ese
      if (msg.thread_id) {
        threadIds.add(msg.thread_id);
        console.log(`[DEBUG getReceivedMessages] Añadido thread_id: ${msg.thread_id} (de mensaje enviado)`);
      } 
      // El ID del propio mensaje puede ser un thread_id para respuestas
      else {
        threadIds.add(msg.id);
        console.log(`[DEBUG getReceivedMessages] Añadido ID como posible thread_id: ${msg.id}`);
      }
    });
    
    console.log(`[DEBUG getReceivedMessages] Hilos donde usuario participó como comprador: ${threadIds.size}`);
    
    // 3. Obtener respuestas en esos hilos (enviadas por otros usuarios)
    // Sin utilizar join implícito para evitar el error
    let threadReplies: DbMessageWithRelations[] = [];
    if (threadIds.size > 0) {
      const threadIdsArray = Array.from(threadIds);
      console.log(`[DEBUG getReceivedMessages] Buscando respuestas en estos hilos: ${threadIdsArray.join(', ')}`);
      
      const { data: replies, error: repliesError } = await supabase
        .from('messages')
        .select(`
          *,
          listings(id, title)
        `)
        .in('thread_id', threadIdsArray)  // En los hilos identificados
        .neq('sender_id', userId)         // No enviados por el usuario (son respuestas)
        .eq('is_deleted', false)          // No eliminados
        .eq('is_archived', false)         // No archivados
        .order('created_at', { ascending: false });
      
      if (repliesError) {
        console.error('Error getting replies in threads:', repliesError);
        throw new Error('Error al obtener respuestas en hilos: ' + repliesError.message);
      }
      
      console.log(`[DEBUG getReceivedMessages] Respuestas encontradas en hilos: ${replies?.length || 0}`);
      
      // Mostrar detalles de las primeras respuestas para depuración
      if (replies && replies.length > 0) {
        const sample = replies.slice(0, Math.min(3, replies.length));
        sample.forEach(msg => {
          console.log(`[DEBUG getReceivedMessages] Respuesta en hilo - ID: ${msg.id}, Thread: ${msg.thread_id}, Sender: ${msg.sender_id}, Seller: ${msg.seller_id}`);
        });
      }
      
      threadReplies = replies || [];
    }
    
    // 4. Combinar mensajes recibidos como vendedor y respuestas a hilos iniciados como comprador
    const allReceivedMessages = [...(receivedAsSeller || []), ...threadReplies];
    console.log(`[DEBUG getReceivedMessages] Total mensajes combinados: ${allReceivedMessages.length}`);
    
    // Eliminar posibles duplicados (por ID de mensaje)
    const uniqueMessageIds = new Set();
    const uniqueReceivedMessages = allReceivedMessages.filter(msg => {
      if (uniqueMessageIds.has(msg.id)) return false;
      uniqueMessageIds.add(msg.id);
      return true;
    });
    
    console.log(`[DEBUG getReceivedMessages] Total mensajes únicos recibidos: ${uniqueReceivedMessages.length}`);
    
    // 5. Recopilar IDs de usuarios para obtener su información
    const userIds = new Set<string>();
    uniqueReceivedMessages.forEach(msg => {
      if (msg.sender_id) userIds.add(msg.sender_id);
      if (msg.seller_id) userIds.add(msg.seller_id);
    });
    
    // 6. Obtener información de usuarios (nombres, correos, etc.)
    const userIdsArray = Array.from(userIds);
    const profiles: Record<string, { id: string, email?: string, full_name?: string, phone?: string }> = {};
    
    if (userIdsArray.length > 0) {
      // Dividir la solicitud en lotes para evitar problemas con grandes conjuntos de IDs
      // y usar un filtro alternativo para evitar el problema con in()
      for (let i = 0; i < userIdsArray.length; i += 10) {
        const batch = userIdsArray.slice(i, i + 10);
        
        // Construir un filtro OR para cada ID
        const filterCondition = batch.map(id => `id.eq.${id}`).join(',');
        
        const { data: userProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .or(filterCondition);
          
        if (!profilesError && userProfiles) {
          userProfiles.forEach(profile => {
            profiles[profile.id] = {
              ...profile,
              phone: '' // Asignar vacío ya que no existe en la BD
            };
          });
        } else if (profilesError) {
          console.error('Error fetching profiles batch:', profilesError);
        }
      }
    }
    
    // 7. Obtener imágenes de los listados
    const listingIds = uniqueReceivedMessages.map(msg => msg.listing_id);
    const imagesByListingId: Record<string, string> = {};
    
    if (listingIds.length > 0) {
      const { data: images, error: imagesError } = await supabase
        .from('listing_images')
        .select('listing_id, url')
        .in('listing_id', listingIds)
        .eq('is_primary', true);
      
      if (!imagesError && images && images.length > 0) {
        images.forEach(img => {
          if (!imagesByListingId[img.listing_id]) {
            imagesByListingId[img.listing_id] = img.url;
          }
        });
      }
    }
    
    // Mapear los resultados al formato MessageData
    return uniqueReceivedMessages.map(msg => {
      // Obtener información del remitente y vendedor de los perfiles
      const sender = profiles[msg.sender_id] || {};
      const seller = profiles[msg.seller_id] || {};
      
      // Extraer información del remitente y vendedor si está disponible
      const senderName = sender.full_name || sender.email || msg.sender_id;
      const sellerName = seller.full_name || seller.email || msg.seller_id;
      const senderPhone = sender.phone || '';
      
      return {
        id: msg.id,
        listingId: msg.listing_id,
        sellerId: msg.seller_id,
        senderId: msg.sender_id,
        subject: msg.subject,
        message: msg.message,
        includePhone: msg.include_phone,
        createdAt: msg.created_at,
        readAt: msg.read_at,
        isArchived: msg.is_archived,
        parentMessageId: msg.parent_message_id,
        threadId: msg.thread_id,
        listingTitle: msg.listings?.title || '',
        listingImage: imagesByListingId[msg.listing_id] || '',
        senderName: senderName,
        sellerName: sellerName,
        senderPhone: senderPhone
      };
    });
  },
  
  /**
   * Obtiene mensajes archivados
   */
  async getArchivedMessages(userId: string): Promise<MessageData[]> {
    const supabase = await createClient();
    
    // 1. Obtener todos los mensajes archivados donde el usuario es el vendedor
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        listings(id, title)
      `)
      .eq('seller_id', userId)
      .eq('is_archived', true)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting archived messages:', error);
      throw new Error('Error al obtener mensajes archivados: ' + error.message);
    }
    
    // 2. Obtener hilos donde el usuario participó como comprador
    // Primero encontramos los mensajes enviados por el usuario que tienen un thread_id
    const { data: sentMessages, error: sentError } = await supabase
      .from('messages')
      .select('thread_id')
      .eq('sender_id', userId)
      .not('thread_id', 'is', null)
      .eq('is_deleted', false);
    
    if (sentError) {
      console.error('Error getting sent message threads:', sentError);
      // Continuamos con los mensajes que ya tenemos
    }
    
    // Extraer los IDs de hilos únicos
    const sentThreadIds = new Set<string>();
    if (sentMessages) {
      sentMessages.forEach(msg => {
        if (msg.thread_id) sentThreadIds.add(msg.thread_id);
      });
    }
    
    // 3. Obtener respuestas archivadas en esos hilos
    let archivedReplies: DbMessageWithRelations[] = [];
    if (sentThreadIds.size > 0) {
      const { data: replies, error: repliesError } = await supabase
        .from('messages')
        .select(`
          *,
          listings(id, title)
        `)
        .in('thread_id', Array.from(sentThreadIds))
        .neq('sender_id', userId)
        .eq('is_archived', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      
      if (repliesError) {
        console.error('Error getting archived thread replies:', repliesError);
      } else {
        archivedReplies = replies || [];
      }
    }
    
    // 4. Combinar mensajes archivados como vendedor y respuestas archivadas como comprador
    const allArchivedMessages = [...(data || []), ...archivedReplies];
    
    // Eliminar duplicados basados en el ID del mensaje
    const uniqueArchivedMessages = allArchivedMessages.filter((message, index, self) => 
      index === self.findIndex(m => m.id === message.id)
    );
    
    // 5. Recopilar IDs de usuarios para obtener su información
    const userIds = new Set<string>();
    uniqueArchivedMessages.forEach(msg => {
      if (msg.sender_id) userIds.add(msg.sender_id);
      if (msg.seller_id) userIds.add(msg.seller_id);
    });
    
    // 6. Obtener información de usuarios (nombres, correos, etc.)
    const userIdsArray = Array.from(userIds);
    const profiles: Record<string, { id: string, email?: string, full_name?: string, phone?: string }> = {};
    
    if (userIdsArray.length > 0) {
      // Dividir la solicitud en lotes para evitar problemas con grandes conjuntos de IDs
      // y usar un filtro alternativo para evitar el problema con in()
      for (let i = 0; i < userIdsArray.length; i += 10) {
        const batch = userIdsArray.slice(i, i + 10);
        
        // Construir un filtro OR para cada ID
        const filterCondition = batch.map(id => `id.eq.${id}`).join(',');
        
        const { data: userProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .or(filterCondition);
          
        if (!profilesError && userProfiles) {
          userProfiles.forEach(profile => {
            profiles[profile.id] = {
              ...profile,
              phone: '' // Asignar vacío ya que no existe en la BD
            };
          });
        } else if (profilesError) {
          console.error('Error fetching profiles batch:', profilesError);
        }
      }
    }
    
    // 7. Obtener las imágenes para los listings
    const listingIds = uniqueArchivedMessages.map(msg => msg.listing_id);
    const imagesByListingId: Record<string, string> = {};
    
    if (listingIds.length > 0) {
      const { data: images, error: imagesError } = await supabase
        .from('listing_images')
        .select('listing_id, url')
        .in('listing_id', listingIds)
        .eq('is_primary', true);
      
      if (!imagesError && images && images.length > 0) {
        images.forEach(img => {
          if (!imagesByListingId[img.listing_id]) {
            imagesByListingId[img.listing_id] = img.url;
          }
        });
      }
    }
    
    return uniqueArchivedMessages.map(msg => {
      // Obtener información del remitente y vendedor de los perfiles
      const sender = profiles[msg.sender_id] || {};
      const seller = profiles[msg.seller_id] || {};
      
      // Extraer información del remitente y vendedor si está disponible
      const senderName = sender.full_name || sender.email || msg.sender_id;
      const sellerName = seller.full_name || seller.email || msg.seller_id;
      const senderPhone = sender.phone || '';
      
      return {
        id: msg.id,
        listingId: msg.listing_id,
        sellerId: msg.seller_id,
        senderId: msg.sender_id,
        subject: msg.subject,
        message: msg.message,
        includePhone: msg.include_phone,
        createdAt: msg.created_at,
        readAt: msg.read_at,
        isArchived: msg.is_archived,
        parentMessageId: msg.parent_message_id,
        threadId: msg.thread_id,
        listingTitle: msg.listings?.title || '',
        listingImage: imagesByListingId[msg.listing_id] || '',
        senderName: senderName,
        sellerName: sellerName,
        senderPhone: senderPhone
      };
    });
  },

  /**
   * Obtiene el conteo de mensajes no leídos para un usuario
   */
  async getUnreadMessageCount(userId: string): Promise<number> {
    const supabase = await createClient();
    
    // Contar mensajes recibidos como vendedor que no han sido leídos
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true})
      .eq('seller_id', userId)
      .is('read_at', null)
      .eq('is_archived', false)
      .eq('is_deleted', false);
    
    if (error) {
      console.error('Error getting unread count:', error);
      throw new Error('Error al obtener conteo de mensajes no leídos: ' + error.message);
    }
    
    return count || 0;
  },
  
  /**
   * Obtiene los mensajes no leídos recientes
   */
  async getRecentUnreadMessages(userId: string, limit: number = 5): Promise<MessageData[]> {
    const supabase = await createClient();
    
    // Obtener mensajes no leídos
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        listings(id, title)
      `)
      .eq('seller_id', userId)
      .is('read_at', null)
      .eq('is_archived', false)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error getting recent unread messages:', error);
      throw new Error('Error al obtener mensajes no leídos recientes: ' + error.message);
    }
    
    // Obtener las imágenes para los listings
    const listingIds = (data || []).map(msg => msg.listing_id);
    const { data: images, error: imagesError } = await supabase
      .from('listing_images')
      .select('listing_id, url')
      .in('listing_id', listingIds)
      .eq('is_primary', true)
      .order('display_order', { ascending: true });
    
    if (imagesError) {
      console.error('Error fetching listing images:', imagesError);
    }
    
    // Crear un mapa de listing_id -> primera imagen
    const imagesByListingId: Record<string, string> = {};
    if (images && images.length > 0) {
      images.forEach(img => {
        if (!imagesByListingId[img.listing_id]) {
          imagesByListingId[img.listing_id] = img.url;
        }
      });
    }
    
    return (data || []).map(msg => ({
      id: msg.id,
      listingId: msg.listing_id,
      sellerId: msg.seller_id,
      senderId: msg.sender_id,
      subject: msg.subject,
      message: msg.message,
      includePhone: msg.include_phone,
      createdAt: msg.created_at,
      readAt: msg.read_at,
      isArchived: msg.is_archived,
      parentMessageId: msg.parent_message_id,
      threadId: msg.thread_id,
      listingTitle: msg.listings?.title || '',
      listingImage: imagesByListingId[msg.listing_id] || '',
    }));
  },

  /**
   * Obtiene un mensaje específico por su ID
   */
  async getMessageById(messageId: string): Promise<MessageData | null> {
    const supabase = await createClient();
    
    // Obtener el mensaje
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        listings(id, title)
      `)
      .eq('id', messageId)
      .eq('is_deleted', false)
      .single();
    
    if (error) {
      // Si el error es de tipo "no se encontraron registros", devolver null
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting message by id:', error);
      throw new Error('Error al obtener mensaje: ' + error.message);
    }
    
    if (!data) {
      return null;
    }
    
    // Obtener la imagen para este listing
    const { data: images, error: imagesError } = await supabase
      .from('listing_images')
      .select('url')
      .eq('listing_id', data.listing_id)
      .eq('is_primary', true)
      .order('display_order', { ascending: true })
      .limit(1);
    
    if (imagesError) {
      console.error('Error fetching listing image:', imagesError);
    }
    
    const listingImage = images && images.length > 0 ? images[0].url : '';
    
    return {
      id: data.id,
      listingId: data.listing_id,
      sellerId: data.seller_id,
      senderId: data.sender_id,
      subject: data.subject,
      message: data.message,
      includePhone: data.include_phone,
      createdAt: data.created_at,
      readAt: data.read_at,
      isArchived: data.is_archived,
      parentMessageId: data.parent_message_id,
      threadId: data.thread_id,
      listingTitle: data.listings?.title || '',
      listingImage: listingImage,
    };
  },

  /**
   * Obtiene un hilo de mensajes por ID
   */
  async getMessageThread(threadId: string, userId: string): Promise<MessageData[]> {
    console.log(`[DEBUG getMessageThread] Obteniendo hilo ${threadId} para usuario ${userId}`);
    const supabase = await createClient();
    
    // 1. Obtener todos los mensajes del hilo especificado, ordenados por fecha
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        listings(id, title)
      `)
      .eq('thread_id', threadId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error getting message thread:', error);
      throw new Error('Error al obtener el hilo de mensajes: ' + error.message);
    }
    
    if (!data || data.length === 0) {
      console.warn(`[DEBUG getMessageThread] No se encontraron mensajes para el hilo ${threadId}`);
      return [];
    }
    
    console.log(`[DEBUG getMessageThread] Encontrados ${data.length} mensajes en el hilo ${threadId}`);
    
    // Verificar si el usuario tiene acceso al hilo
    const userIsParticipant = data.some(msg => 
      msg.sender_id === userId || msg.seller_id === userId
    );
    
    if (!userIsParticipant) {
      console.warn(`[DEBUG getMessageThread] Usuario ${userId} no es participante en el hilo ${threadId}`);
      throw new Error('No tienes permiso para acceder a este hilo de mensajes');
    }
    
    // 2. Recopilar IDs de usuarios para obtener su información
    const userIds = new Set<string>();
    data.forEach(msg => {
      if (msg.sender_id) userIds.add(msg.sender_id);
      if (msg.seller_id) userIds.add(msg.seller_id);
    });
    
    // 3. Obtener información de perfiles de usuarios
    const userIdsArray = Array.from(userIds);
    const profiles: Record<string, { id: string, email?: string, full_name?: string, phone?: string }> = {};
    
    if (userIdsArray.length > 0) {
      // Dividir la solicitud en lotes para evitar problemas con grandes conjuntos de IDs
      // y usar un filtro alternativo para evitar el problema con in()
      for (let i = 0; i < userIdsArray.length; i += 10) {
        const batch = userIdsArray.slice(i, i + 10);
        
        // Construir un filtro OR para cada ID
        const filterCondition = batch.map(id => `id.eq.${id}`).join(',');
        
        const { data: userProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .or(filterCondition);
          
        if (!profilesError && userProfiles) {
          userProfiles.forEach(profile => {
            profiles[profile.id] = {
              ...profile,
              phone: '' // Asignar vacío ya que no existe en la BD
            };
          });
        } else if (profilesError) {
          console.error('Error fetching profiles batch:', profilesError);
        }
      }
    }
    
    // 4. Obtener imágenes para los listings
    const listingIds = data.map(msg => msg.listing_id).filter(id => id);
    const imagesByListingId: Record<string, string> = {};
    
    if (listingIds.length > 0) {
      const { data: images, error: imagesError } = await supabase
        .from('listing_images')
        .select('listing_id, url')
        .in('listing_id', listingIds)
        .eq('is_primary', true)
        .order('display_order', { ascending: true });
      
      if (!imagesError && images && images.length > 0) {
        images.forEach(img => {
          if (!imagesByListingId[img.listing_id]) {
            imagesByListingId[img.listing_id] = img.url;
          }
        });
      }
    }
    
    // 5. Marcar mensajes como leídos si el usuario es el destinatario
    const messagesToMarkAsRead = data
      .filter(msg => msg.seller_id === userId && msg.sender_id !== userId && !msg.read_at)
      .map(msg => msg.id);
      
    if (messagesToMarkAsRead.length > 0) {
      console.log(`[DEBUG getMessageThread] Marcando ${messagesToMarkAsRead.length} mensajes como leídos`);
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read_at: now })
        .in('id', messagesToMarkAsRead);
        
      if (updateError) {
        console.error('Error marking messages as read:', updateError);
      }
    }
    
    // 6. Mapear resultados al tipo MessageData
    return data.map(msg => {
      // Obtener información del remitente y vendedor de los perfiles
      const sender = profiles[msg.sender_id] || {};
      const seller = profiles[msg.seller_id] || {};
      
      // Extraer información del remitente y vendedor si está disponible
      const senderName = sender.full_name || sender.email || msg.sender_id;
      const sellerName = seller.full_name || seller.email || msg.seller_id;
      const senderPhone = sender.phone || '';
      
      return {
        id: msg.id,
        listingId: msg.listing_id,
        sellerId: msg.seller_id,
        senderId: msg.sender_id,
        subject: msg.subject,
        message: msg.message,
        includePhone: msg.include_phone,
        createdAt: msg.created_at,
        readAt: msg.read_at || (messagesToMarkAsRead.includes(msg.id) ? new Date().toISOString() : null),
        isArchived: msg.is_archived,
        parentMessageId: msg.parent_message_id,
        threadId: msg.thread_id,
        listingTitle: msg.listings?.title || '',
        listingImage: imagesByListingId[msg.listing_id] || '',
        senderName: senderName,
        sellerName: sellerName,
        senderPhone: senderPhone
      };
    });
  },

  /**
   * Responde a un mensaje existente
   */
  async replyToMessage(
    originalMessageId: string, 
    replyData: { message: string },
    senderId: string
  ): Promise<MessageData> {
    const supabase = await createClient();
    
    // Obtener el mensaje original
    const { data: originalMessage, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', originalMessageId)
      .single();
    
    if (fetchError || !originalMessage) {
      console.error('Error fetching original message:', fetchError);
      throw new Error('Error al obtener mensaje original: ' + (fetchError?.message || 'No encontrado'));
    }
    
    // Determinar si el que responde es el vendedor original o el comprador
    const isSeller = senderId === originalMessage.seller_id;
    const recipientId = isSeller 
      ? originalMessage.sender_id  // Si responde el vendedor, el destinatario es el comprador
      : originalMessage.seller_id; // Si responde el comprador, el destinatario es el vendedor
    
    // Preparar el hilo (usar el existente o crear uno nuevo)
    const threadId = originalMessage.thread_id || originalMessage.id;
    
    // Insertar la respuesta
    const { data, error } = await supabase
      .from('messages')
      .insert({
        listing_id: originalMessage.listing_id,
        seller_id: recipientId,               // aqui es donde supongo yo es el error
        sender_id: senderId,                   // El sender_id es quien está respondiendo (puede ser comprador o vendedor)
        subject: `Re: ${originalMessage.subject || 'Sin asunto'}`,
        message: replyData.message,
        include_phone: false,
        parent_message_id: originalMessageId,
        thread_id: threadId,
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error sending reply:', error);
      throw new Error('Error al enviar respuesta: ' + error.message);
    }
    
    // Si el mensaje original no tenía thread_id (es el primer mensaje del hilo),
    // actualizamos el mensaje original para que apunte al mismo thread
    if (!originalMessage.thread_id) {
      await supabase
        .from('messages')
        .update({ thread_id: threadId })
        .eq('id', originalMessageId);
    }
    
    console.log(`Respuesta enviada: thread_id=${threadId}, sender=${senderId}, recipient=${recipientId}, es_vendedor=${isSeller}`);
    
    // Devolver el mensaje creado
    return {
      id: data.id,
      listingId: data.listing_id,
      sellerId: data.seller_id,
      senderId: data.sender_id,
      subject: data.subject,
      message: data.message,
      includePhone: data.include_phone,
      createdAt: data.created_at,
      readAt: data.read_at,
      isArchived: data.is_archived || false,
      parentMessageId: data.parent_message_id,
      threadId: data.thread_id,
    };
  },
  
  /**
   * Marca un mensaje como leído
   */
  async markAsRead(messageId: string): Promise<void> {
    const supabase = await createClient();
    
    // Obtener primero el mensaje para verificación (opcional)
    const { error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching message:', fetchError);
      throw new Error('Error al obtener mensaje: ' + fetchError.message);
    }
    
    // Marcar como leído
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);
    
    if (error) {
      console.error('Error marking message as read:', error);
      throw new Error('Error al marcar mensaje como leído: ' + error.message);
    }
  },
  
  /**
   * Marca varios mensajes como leídos
   */
  async markAsReadBulk(messageIds: string[]): Promise<void> {
    if (!messageIds.length) return;
    
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds);
    
    if (error) {
      console.error('Error marking messages as read bulk:', error);
      throw new Error('Error al marcar mensajes como leídos: ' + error.message);
    }
  },
  
  /**
   * Marca un mensaje como no leído
   */
  async markAsUnread(messageId: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .rpc('mark_message_as_unread', {
        message_id: messageId
      });
    
    if (error) {
      console.error('Error marking message as unread:', error);
      throw new Error('Error al marcar mensaje como no leído: ' + error.message);
    }
  },
  
  /**
   * Archiva un mensaje
   */
  async archiveMessage(messageId: string): Promise<void> {
    const supabase = await  createClient();
    
    // Obtener ID del usuario actual para la política RLS
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    const { error } = await supabase
      .rpc('archive_message', {
        message_id: messageId,
        user_id: userId
      });
    
    if (error) {
      console.error('Error archiving message:', error);
      throw new Error('Error al archivar mensaje: ' + error.message);
    }
  },
  
  /**
   * Desarchiva un mensaje
   */
  async unarchiveMessage(messageId: string): Promise<void> {
    const supabase = await createClient();
    
    // Obtener ID del usuario actual para la política RLS
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    const { error } = await supabase
      .rpc('unarchive_message', {
        message_id: messageId,
        user_id: userId
      });
    
    if (error) {
      console.error('Error unarchiving message:', error);
      throw new Error('Error al desarchivar mensaje: ' + error.message);
    }
  },
  
  /**
   * Elimina un mensaje y opcionalmente todos sus mensajes relacionados.
   * Si no se puede eliminar físicamente debido a restricciones de clave externa,
   * se marca como eliminado virtualmente usando el campo is_deleted.
   */
  async deleteMessage(messageId: string, deleteRelated: boolean = true): Promise<void> {
    const supabase = await createClient();
    
    try {
      console.log(`Intentando eliminar mensaje ${messageId}. deleteRelated=${deleteRelated}`);
      
      // 1. Verificar si este mensaje tiene mensajes hijos (respuestas directas)
      const { data: childMessages, error: checkError } = await supabase
        .from('messages')
        .select('id')
        .eq('parent_message_id', messageId)
        .eq('is_deleted', false);
      
      if (checkError) {
        console.error('Error verificando mensajes hijos:', checkError);
        throw checkError;
      }
      
      console.log(`Mensaje ${messageId} tiene ${childMessages?.length || 0} hijos directos activos`);
      
      // 2. Si tiene mensajes hijos y deleteRelated está activado, eliminarlos recursivamente
      if (childMessages && childMessages.length > 0) {
        if (deleteRelated) {
          console.log(`Eliminando recursivamente ${childMessages.length} mensajes hijos...`);
          // Eliminar recursivamente todos los mensajes hijos
          for (const childMsg of childMessages) {
            console.log(`- Eliminando hijo: ${childMsg.id}`);
            await this.deleteMessage(childMsg.id, true);
          }
        } else {
          // Si no podemos eliminar físicamente, intentamos una eliminación virtual
          console.log('Marcando como eliminado virtualmente...');
          
          // Obtener mensaje original para preservar la longitud
          const { data: originalMessage } = await supabase
            .from('messages')
            .select('message')
            .eq('id', messageId)
            .single();
          
          let deletedMessageText = '[Mensaje eliminado] Este mensaje ha sido eliminado por el usuario pero se mantiene para preservar la conversación. El contenido original ya no está disponible.';
          
          // Si el mensaje original existe, aseguramos que el nuevo mensaje tenga al menos la misma longitud
          if (originalMessage) {
            const originalLength = originalMessage.message.length;
            if (originalLength > deletedMessageText.length) {
              const deletedPrefix = '[ELIMINADO] ';
              const fillerText = 'Este mensaje ha sido eliminado. ';
              let newMessage = deletedPrefix;
              
              // Rellenar hasta alcanzar la longitud original
              while (newMessage.length < originalLength) {
                newMessage += fillerText;
              }
              
              deletedMessageText = newMessage;
            }
          }
          
          const { error: updateError } = await supabase
            .from('messages')
            .update({
              message: deletedMessageText,
              is_deleted: true
            })
            .eq('id', messageId);
          
          if (updateError) {
            console.error('Error al marcar mensaje como eliminado:', updateError);
            
            if (updateError.code === '23514' && updateError.message.includes('valid_message_length')) {
              // Si el problema es la longitud del mensaje, intentamos obtener el mensaje original primero
              const { data: originalMessage } = await supabase
                .from('messages')
                .select('message')
                .eq('id', messageId)
                .single();
              
              if (originalMessage) {
                // Mantenemos la longitud original pero modificamos el contenido
                const deletedText = '[ELIMINADO] ';
                const fillerText = 'Este mensaje ha sido eliminado. ';
                const originalLength = originalMessage.message.length;
                let newMessage = deletedText;
                
                // Rellenar hasta alcanzar la longitud original (o un mínimo de 50 caracteres)
                while (newMessage.length < Math.max(originalLength, 50)) {
                  newMessage += fillerText;
                }
                
                // Intentar nuevamente la actualización con un mensaje de longitud adecuada
                const { error: retryError } = await supabase
                  .from('messages')
                  .update({
                    message: newMessage,
                    is_deleted: true
                  })
                  .eq('id', messageId);
                  
                if (retryError) {
                  console.error('Error en segundo intento de marcar como eliminado:', retryError);
                  throw new Error(`No se puede eliminar ni marcar como eliminado: ${retryError.message}`);
                } else {
                  console.log(`Mensaje ${messageId} marcado como eliminado virtualmente (segundo intento exitoso).`);
                  return;
                }
              }
            }
            
            throw new Error(`No se puede eliminar ni marcar como eliminado: ${updateError.message}`);
          }
          
          console.log(`Mensaje ${messageId} marcado como eliminado virtualmente.`);
          return;
        }
      }
      
      // 3. Verificar si es parte de un hilo como mensaje raíz
      const { data: threadMessages, error: threadCheckError } = await supabase
        .from('messages')
        .select('id, thread_id')
        .eq('thread_id', messageId)
        .eq('is_deleted', false);
      
      if (threadCheckError) {
        console.error('Error verificando mensajes del hilo:', threadCheckError);
        throw new Error(`Error al verificar mensajes del hilo: ${threadCheckError.message}`);
      }
      
      console.log(`Mensaje ${messageId} es raíz de hilo para ${threadMessages?.length || 0} mensajes activos`);
      
      // 4. Manejar otros mensajes que usan este mensaje como ID de hilo
      if (threadMessages && threadMessages.length > 0) {
        if (deleteRelated) {
          console.log(`Eliminando todos los ${threadMessages.length} mensajes del hilo...`);
          // Eliminar todos los mensajes del hilo excepto el actual (que eliminaremos después)
          for (const threadMsg of threadMessages) {
            if (threadMsg.id !== messageId) {
              console.log(`- Eliminando mensaje del hilo: ${threadMsg.id}`);
              await this.deleteMessage(threadMsg.id, true);
            }
          }
        } else {
          // Si no podemos eliminar físicamente, intentamos una eliminación virtual
          console.log('Marcando como eliminado virtualmente...');
          
          // Obtener mensaje original para preservar la longitud
          const { data: originalMessage } = await supabase
            .from('messages')
            .select('message')
            .eq('id', messageId)
            .single();
          
          let deletedMessageText = '[Mensaje eliminado] Este mensaje ha sido eliminado por el usuario pero se mantiene para preservar la conversación. El contenido original ya no está disponible.';
          
          // Si el mensaje original existe, aseguramos que el nuevo mensaje tenga al menos la misma longitud
          if (originalMessage) {
            const originalLength = originalMessage.message.length;
            if (originalLength > deletedMessageText.length) {
              const deletedPrefix = '[ELIMINADO] ';
              const fillerText = 'Este mensaje ha sido eliminado. ';
              let newMessage = deletedPrefix;
              
              // Rellenar hasta alcanzar la longitud original
              while (newMessage.length < originalLength) {
                newMessage += fillerText;
              }
              
              deletedMessageText = newMessage;
            }
          }
          
          const { error: updateError } = await supabase
            .from('messages')
            .update({
              message: deletedMessageText,
              is_deleted: true
            })
            .eq('id', messageId);
          
          if (updateError) {
            console.error('Error al marcar mensaje como eliminado:', updateError);
            
            if (updateError.code === '23514' && updateError.message.includes('valid_message_length')) {
              // Si el problema es la longitud del mensaje, intentamos obtener el mensaje original primero
              const { data: originalMessage } = await supabase
                .from('messages')
                .select('message')
                .eq('id', messageId)
                .single();
              
              if (originalMessage) {
                // Mantenemos la longitud original pero modificamos el contenido
                const deletedText = '[ELIMINADO] ';
                const fillerText = 'Este mensaje ha sido eliminado. ';
                const originalLength = originalMessage.message.length;
                let newMessage = deletedText;
                
                // Rellenar hasta alcanzar la longitud original (o un mínimo de 50 caracteres)
                while (newMessage.length < Math.max(originalLength, 50)) {
                  newMessage += fillerText;
                }
                
                // Intentar nuevamente la actualización con un mensaje de longitud adecuada
                const { error: retryError } = await supabase
                  .from('messages')
                  .update({
                    message: newMessage,
                    is_deleted: true
                  })
                  .eq('id', messageId);
                  
                if (retryError) {
                  console.error('Error en segundo intento de marcar como eliminado:', retryError);
                  throw new Error(`No se puede eliminar ni marcar como eliminado: ${retryError.message}`);
                } else {
                  console.log(`Mensaje ${messageId} marcado como eliminado virtualmente (segundo intento exitoso).`);
                  return;
                }
              }
            }
            
            throw new Error(`No se puede eliminar ni marcar como eliminado: ${updateError.message}`);
          }
          
          console.log(`Mensaje ${messageId} marcado como eliminado virtualmente.`);
          return;
        }
      }
      
      // 5. Intentar eliminar físicamente el mensaje
      console.log(`Intentando eliminar físicamente el mensaje ${messageId}...`);
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (deleteError) {
        console.error('Error al eliminar físicamente el mensaje:', deleteError);
        
        // Si hay un error de restricción de clave externa, marcamos como eliminado virtualmente
        if (deleteError.code === '23503') {
          console.log('No se puede eliminar físicamente debido a restricciones de clave externa. Marcando como eliminado virtualmente...');
          
          // Obtener mensaje original para preservar la longitud
          const { data: originalMessage } = await supabase
            .from('messages')
            .select('message')
            .eq('id', messageId)
            .single();
          
          let deletedMessageText = '[Mensaje eliminado] Este mensaje ha sido eliminado por el usuario pero se mantiene para preservar la conversación. El contenido original ya no está disponible.';
          
          // Si el mensaje original existe, aseguramos que el nuevo mensaje tenga al menos la misma longitud
          if (originalMessage) {
            const originalLength = originalMessage.message.length;
            if (originalLength > deletedMessageText.length) {
              const deletedPrefix = '[ELIMINADO] ';
              const fillerText = 'Este mensaje ha sido eliminado. ';
              let newMessage = deletedPrefix;
              
              // Rellenar hasta alcanzar la longitud original
              while (newMessage.length < originalLength) {
                newMessage += fillerText;
              }
              
              deletedMessageText = newMessage;
            }
          }
          
          const { error: updateError } = await supabase
            .from('messages')
            .update({
              message: deletedMessageText,
              is_deleted: true
            })
            .eq('id', messageId);
          
          if (updateError) {
            console.error('Error al marcar mensaje como eliminado:', updateError);
            
            if (updateError.code === '23514' && updateError.message.includes('valid_message_length')) {
              // Si el problema es la longitud del mensaje, intentamos obtener el mensaje original primero
              const { data: originalMessage } = await supabase
                .from('messages')
                .select('message')
                .eq('id', messageId)
                .single();
              
              if (originalMessage) {
                // Mantenemos la longitud original pero modificamos el contenido
                const deletedText = '[ELIMINADO] ';
                const fillerText = 'Este mensaje ha sido eliminado. ';
                const originalLength = originalMessage.message.length;
                let newMessage = deletedText;
                
                // Rellenar hasta alcanzar la longitud original (o un mínimo de 50 caracteres)
                while (newMessage.length < Math.max(originalLength, 50)) {
                  newMessage += fillerText;
                }
                
                // Intentar nuevamente la actualización con un mensaje de longitud adecuada
                const { error: retryError } = await supabase
                  .from('messages')
                  .update({
                    message: newMessage,
                    is_deleted: true
                  })
                  .eq('id', messageId);
                  
                if (retryError) {
                  console.error('Error en segundo intento de marcar como eliminado:', retryError);
                  throw new Error(`No se puede eliminar ni marcar como eliminado: ${retryError.message}`);
                } else {
                  console.log(`Mensaje ${messageId} marcado como eliminado virtualmente (segundo intento exitoso).`);
                  return;
                }
              }
            }
            
            throw new Error(`No se puede eliminar ni marcar como eliminado: ${updateError.message}`);
          }
          
          console.log(`Mensaje ${messageId} marcado como eliminado virtualmente.`);
          return;
        }
        
        throw new Error(`Error al eliminar mensaje: ${deleteError.message || JSON.stringify(deleteError)}`);
      }
      
      console.log(`Mensaje ${messageId} eliminado físicamente con éxito.`);
      
    } catch (error) {
      console.error('Error en proceso de eliminación de mensaje:', error);
      
      // Mejorar el manejo de diferentes tipos de errores
      if (error instanceof Error) {
        throw error; // Rearrojar si ya es un Error con mensaje formateado
      } else if (typeof error === 'object' && error !== null) {
        // Intentar extraer un mensaje útil del objeto de error
        const errorObj = error as { 
          message?: string; 
          error_description?: string; 
          details?: string;
          code?: string;
        };
        const errorMessage = errorObj.message || errorObj.error_description || errorObj.details || JSON.stringify(error);
        throw new Error(`Error al eliminar mensaje: ${errorMessage}`);
      } else {
        throw new Error(`Error al eliminar mensaje: ${String(error)}`);
      }
    }
  },

  /**
   * Obtiene todas las conversaciones agrupadas por hilo para un usuario,
   * independientemente de si es comprador o vendedor
   */
  async getConversations(userId: string): Promise<{
    conversations: Record<string, MessageData[]>;
    unreadCount: number;
  }> {
    const supabase = await createClient();
    
    console.log(`[DEBUG getConversations] Obteniendo conversaciones para usuario: ${userId}`);
    
    // 1. Primero, obtener todos los hilos donde el usuario es participante (como remitente, vendedor o destinatario)
    // El nuevo enfoque busca todos los hilos donde:
    // - El usuario es vendedor 
    // - El usuario es remitente
    // - El usuario es destinatario (esto es nuevo): comprador recibiendo respuesta

    // 1. Primera consulta: obtener hilos donde el usuario es vendedor o remitente
    const { data: userBasicThreads, error: userBasicThreadsError } = await supabase
      .from('messages')
      .select('id, thread_id, sender_id, seller_id')
      .or(`seller_id.eq.${userId},sender_id.eq.${userId}`)
      .eq('is_deleted', false);
      
    if (userBasicThreadsError) {
      console.error('Error getting user basic threads:', userBasicThreadsError);
      throw new Error('Error al obtener hilos básicos: ' + userBasicThreadsError.message);
    }
    
    // 2. Segunda consulta: obtener TODOS los mensajes y filtrar los que son relevantes para el usuario como destinatario
    const { data: allMessages, error: allMessagesError } = await supabase
      .from('messages')
      .select('id, thread_id, sender_id, seller_id, parent_message_id, created_at')
      .eq('is_deleted', false);
      
    if (allMessagesError) {
      console.error('Error getting all messages:', allMessagesError);
      throw new Error('Error al obtener todos los mensajes: ' + allMessagesError.message);
    }
    
    // Filtrar manualmente para obtener mensajes donde:
    // - El remitente es el vendedor (sender_id === seller_id)
    // - El remitente NO es el usuario actual (sender_id !== userId)
    // - Y son respuestas a mensajes del usuario, o el usuario es parte del thread
    
    // Primero, obtendremos los thread_ids de los mensajes que el usuario ha enviado
    const userSentThreads = new Set<string>();
    userBasicThreads?.forEach(msg => {
      if (msg.sender_id === userId) {
        if (msg.thread_id) {
          userSentThreads.add(msg.thread_id);
        } else {
          userSentThreads.add(msg.id);
        }
      }
    });
    
    console.log(`[DEBUG getConversations] El usuario ${userId} ha participado en ${userSentThreads.size} hilos como remitente`);
    
    // Ahora filtramos para encontrar respuestas en esos hilos
    const recipientThreads = allMessages?.filter(msg => {
      // El remitente es el vendedor (respuesta de vendedor)
      const isSenderSeller = msg.sender_id === msg.seller_id;
      
      // El remitente no es el usuario actual
      const isNotCurrentUser = msg.sender_id !== userId;
      
      // Es parte de un hilo donde el usuario ha enviado mensajes
      const isInUserThread = msg.thread_id && userSentThreads.has(msg.thread_id);
      
      // O es una respuesta directa a un mensaje del usuario
      const isDirectReplyToUser = msg.parent_message_id && userSentThreads.has(msg.parent_message_id);
      
      // Cumple todas las condiciones
      return isSenderSeller && isNotCurrentUser && (isInUserThread || isDirectReplyToUser);
    }) || [];
    
    // Combinar los resultados
    const userThreads = [...(userBasicThreads || []), ...recipientThreads];
    
    console.log(`[DEBUG getConversations] Encontrados ${userThreads.length} hilos para usuario: ${userId}`);
    console.log(`   - ${userBasicThreads?.length || 0} hilos como vendedor/remitente`);
    console.log(`   - ${recipientThreads?.length || 0} hilos como destinatario`);
    
    // Extraer todos los thread_id únicos donde el usuario participó
    const threadIds = new Set<string>();
    
    userThreads.forEach(msg => {
      // Si el mensaje tiene thread_id, usamos ese
      if (msg.thread_id) {
        threadIds.add(msg.thread_id);
        console.log(`[DEBUG getConversations] Añadido thread_id existente: ${msg.thread_id}`);
      } 
      // Si el mensaje no tiene thread_id, su propio ID podría ser el thread_id para otros mensajes
      else {
        threadIds.add(msg.id);
        console.log(`[DEBUG getConversations] Añadido ID de mensaje como posible thread_id: ${msg.id}`);
      }
    });
    
    console.log(`[DEBUG getConversations] Se encontraron ${threadIds.size} hilos únicos`);
    
    // 2. Ahora, obtener TODOS los mensajes de esos hilos, sin unir con sender/seller
    let allMessagesInThreads: DbMessageWithRelations[] = [];
    
    if (threadIds.size > 0) {
      // Convertir el Set a Array para la consulta
      const threadIdsArray = Array.from(threadIds);
      console.log(`[DEBUG getConversations] Buscando mensajes en estos hilos: ${threadIdsArray.join(', ')}`);
      
      // IMPORTANTE: Incluir tanto mensajes con thread_id que coincide 
      // COMO mensajes cuyo ID coincide con alguno de los thread_ids 
      // (para capturar cabezas de hilo que pueden no tener thread_id propio)
      const { data: allThreadMessages, error: threadError } = await supabase
        .from('messages')
        .select(`
          *,
          listings(id, title)
        `)
        .or(`thread_id.in.(${threadIdsArray.join(',')}),id.in.(${threadIdsArray.join(',')})`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      
      if (threadError) {
        console.error('Error getting full thread messages:', threadError);
        console.error('Error details:', JSON.stringify(threadError));
      } else {
        console.log(`[DEBUG getConversations] Se encontraron ${allThreadMessages?.length || 0} mensajes en hilos`);
        if (allThreadMessages) {
          allMessagesInThreads = [...allMessagesInThreads, ...allThreadMessages];
          
          // Log completo de todos los mensajes encontrados para depuración
          console.log('[DEBUG getConversations] Lista completa de mensajes encontrados:');
          allThreadMessages.forEach(msg => {
            console.log(`  - Mensaje ID: ${msg.id}, Thread: ${msg.thread_id || '(null)'}, Parent: ${msg.parent_message_id || '(null)'}, Sender: ${msg.sender_id}, Seller: ${msg.seller_id}, Created: ${msg.created_at}`);
          });
        }
      }

      // Depuración: Contar mensajes por thread_id para verificar
      const countByThread: Record<string, number> = {};
      allMessagesInThreads.forEach(msg => {
        const threadKey = msg.thread_id || msg.id;
        countByThread[threadKey] = (countByThread[threadKey] || 0) + 1;
      });
      
      console.log('[DEBUG getConversations] Conteo de mensajes por thread_id:');
      Object.entries(countByThread).forEach(([threadId, count]) => {
        console.log(`  - Thread ${threadId}: ${count} mensajes`);
      });
    }
    
    // 3. Eliminar duplicados
    console.log(`[DEBUG getConversations] Total de mensajes antes de eliminar duplicados: ${allMessagesInThreads.length}`);
    
    const uniqueMessages = allMessagesInThreads.filter((message, index, self) => 
      index === self.findIndex(m => m.id === message.id)
    );
    
    console.log(`[DEBUG getConversations] Total de mensajes después de eliminar duplicados: ${uniqueMessages.length}`);
    
    // 4. Recopilar los IDs de todos los usuarios (remitentes y vendedores) para obtener sus datos
    const userIds = new Set<string>();
    uniqueMessages.forEach(msg => {
      if (msg.sender_id) userIds.add(msg.sender_id);
      if (msg.seller_id) userIds.add(msg.seller_id);
    });
    
    // 5. Obtener información de usuarios (nombres, correos, etc.)
    const userIdsArray = Array.from(userIds);
    const profiles: Record<string, { id: string, email?: string, full_name?: string, phone?: string }> = {};
    
    if (userIdsArray.length > 0) {
      // Dividir la solicitud en lotes para evitar problemas con grandes conjuntos de IDs
      // y usar un filtro alternativo para evitar el problema con in()
      for (let i = 0; i < userIdsArray.length; i += 10) {
        const batch = userIdsArray.slice(i, i + 10);
        
        // Construir un filtro OR para cada ID
        const filterCondition = batch.map(id => `id.eq.${id}`).join(',');
        
        const { data: userProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .or(filterCondition);
          
        if (!profilesError && userProfiles) {
          userProfiles.forEach(profile => {
            profiles[profile.id] = {
              ...profile,
              phone: '' // Asignar vacío ya que no existe en la BD
            };
          });
        } else if (profilesError) {
          console.error('Error fetching profiles batch:', profilesError);
        }
      }
    }
    
    // 6. Obtener imágenes de listados
    const listingIds = Array.from(new Set(uniqueMessages.map(msg => msg.listing_id)));
    
    const imagesByListingId: Record<string, string> = {};
    if (listingIds.length > 0) {
      const { data: images, error: imagesError } = await supabase
        .from('listing_images')
        .select('listing_id, url')
        .in('listing_id', listingIds)
        .eq('is_primary', true)
        .order('display_order', { ascending: true });
      
      if (!imagesError && images && images.length > 0) {
        images.forEach(img => {
          if (!imagesByListingId[img.listing_id]) {
            imagesByListingId[img.listing_id] = img.url;
          }
        });
      }
    }
    
    // 7. Contar mensajes no leídos
    // Modificado: Incluir mensajes no leídos tanto para vendedor como para comprador
    const unreadMessages = uniqueMessages.filter(msg => {
      // Determinar si el mensaje está dirigido al usuario actual
      const isMessageForUser = 
        (msg.seller_id === userId && msg.sender_id !== userId) || // Usuario es vendedor recibiendo mensaje
        (msg.sender_id !== userId && msg.sender_id === msg.seller_id);   // Usuario es comprador recibiendo respuesta del vendedor
      
      return isMessageForUser && msg.read_at === null; // El mensaje está dirigido al usuario y no está leído
    });
    
    const unreadCount = unreadMessages.length;
    console.log(`[DEBUG getConversations] Mensajes no leídos: ${unreadCount}`);
    
    // 8. Agrupar mensajes por hilo de conversación
    const conversations: Record<string, MessageData[]> = {};
    
    uniqueMessages.forEach(msg => {
      // Determinar la clave del hilo:
      // 1. Usar thread_id si existe
      // 2. Si no, usar el ID del propio mensaje (puede ser el inicio de un hilo)
      const threadKey = msg.thread_id || msg.id;
      
      if (!conversations[threadKey]) {
        conversations[threadKey] = [];
      }
      
      // Obtener información del remitente y vendedor de los perfiles
      const sender = profiles[msg.sender_id] || {};
      const seller = profiles[msg.seller_id] || {};
      
      // Extraer información del remitente y vendedor si está disponible
      const senderName = sender.full_name || sender.email || msg.sender_id;
      const sellerName = seller.full_name || seller.email || msg.seller_id;
      const senderPhone = sender.phone || '';
      
      conversations[threadKey].push({
        id: msg.id,
        listingId: msg.listing_id,
        sellerId: msg.seller_id,
        senderId: msg.sender_id,
        subject: msg.subject,
        message: msg.message,
        includePhone: msg.include_phone,
        createdAt: msg.created_at,
        readAt: msg.read_at,
        isArchived: msg.is_archived,
        parentMessageId: msg.parent_message_id,
        threadId: msg.thread_id,
        listingTitle: msg.listings?.title || '',
        listingImage: imagesByListingId[msg.listing_id] || '',
        senderName: senderName,
        sellerName: sellerName,
        senderPhone: senderPhone
      });
    });
    
    // 9. Ordenar mensajes dentro de cada conversación por fecha ascendente
    Object.keys(conversations).forEach(threadKey => {
      conversations[threadKey].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      console.log(`[DEBUG getConversations] Hilo ${threadKey}: ${conversations[threadKey].length} mensajes`);
      
      // Imprimir detalles del primer y último mensaje para depuración
      if (conversations[threadKey].length > 0) {
        const firstMsg = conversations[threadKey][0];
        const lastMsg = conversations[threadKey][conversations[threadKey].length - 1];
        
        console.log(`[DEBUG getConversations] Primer mensaje del hilo ${threadKey}: ID=${firstMsg.id}, Sender=${firstMsg.senderId}, Seller=${firstMsg.sellerId}`);
        console.log(`[DEBUG getConversations] Último mensaje del hilo ${threadKey}: ID=${lastMsg.id}, Sender=${lastMsg.senderId}, Seller=${lastMsg.sellerId}`);
      }
    });
    
    // Registrar el número total de hilos encontrados
    console.log(`[DEBUG getConversations] Total de hilos de conversación: ${Object.keys(conversations).length}`);
    
    return { conversations, unreadCount };
  },

  /**
   * Crea un hilo de comunicación para una reserva confirmada
   * @param sellerId ID del vendedor (dueño del vehículo)
   * @param buyerId ID del comprador que hizo la reserva
   * @param listingId ID del vehículo reservado
   * @param reservationId ID de la reserva
   * @returns ID del mensaje creado o null si ocurrió un error
   */
  async createReservationThread(
    sellerId: string,
    buyerId: string,
    listingId: string,
    reservationId: string
  ): Promise<string | null> {
    try {
      const supabase = await createClient();
      
      // Verificar si ya existe un hilo de comunicación para esta reserva
      const { data: existingThreads } = await supabase
        .from('messages')
        .select('id')
        .eq('related_id', reservationId);
      
      if (existingThreads && existingThreads.length > 0) {
        console.log('Reservation thread already exists');
        return existingThreads[0].id;
      }
      
      // Obtener información del vehículo
      const { data: listing } = await supabase
        .from('listings')
        .select('title, year, make, model')
        .eq('id', listingId)
        .single();
      
      if (!listing) {
        console.error('Listing not found for reservation thread');
        return null;
      }
      
      // Generar un ID único para el mensaje
      const messageId = uuidv4();
      
      // Crear el mensaje inicial del sistema
      const message = {
        id: messageId,
        thread_id: messageId, // El ID del mensaje es también el ID del hilo
        sender_id: 'system', // Mensaje enviado por el sistema
        receiver_id: sellerId, // Dirigido primariamente al vendedor
        listing_id: listingId,
        content: `Se ha confirmado la reserva del vehículo ${listing.make} ${listing.model} ${listing.year}. Este es un canal de comunicación directo entre comprador y vendedor para coordinar los próximos pasos.`,
        read: false,
        related_id: reservationId,
        created_at: new Date().toISOString()
      };
      
      // Insertarlo en la base de datos
      const { error } = await supabase
        .from('messages')
        .insert(message);
      
      if (error) {
        console.error('Error creating reservation thread:', error);
        return null;
      }
      
      // Crear una notificación para ambas partes sobre el nuevo canal de comunicación
      await this._createThreadNotification(sellerId, buyerId, listingId, messageId);
      
      return messageId;
    } catch (error) {
      console.error('Error in createReservationThread:', error);
      return null;
    }
  },
  
  /**
   * Método privado para crear notificaciones sobre un nuevo hilo de comunicación
   */
  async _createThreadNotification(
    sellerId: string,
    buyerId: string,
    listingId: string,
    threadId: string
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      // Obtener información del vehículo
      const { data: listing } = await supabase
        .from('listings')
        .select('title')
        .eq('id', listingId)
        .single();
      
      if (!listing) return;
      
      // Preparar los datos de la notificación
      const now = new Date().toISOString();
      
      // Notificación para el vendedor
      const sellerNotification = {
        user_id: sellerId,
        type: 'message_received',
        title: 'Nueva comunicación de reserva',
        message: `Se ha establecido un canal de comunicación para la reserva del vehículo ${listing.title}`,
        link: `/messages?thread=${threadId}`,
        related_id: threadId,
        read: false,
        created_at: now
      };
      
      // Notificación para el comprador
      const buyerNotification = {
        user_id: buyerId,
        type: 'message_received',
        title: 'Nueva comunicación de reserva',
        message: `Se ha establecido un canal de comunicación para la reserva del vehículo ${listing.title}`,
        link: `/messages?thread=${threadId}`,
        related_id: threadId,
        read: false,
        created_at: now
      };
      
      // Insertar notificaciones
      await supabase.from('notifications').insert([sellerNotification, buyerNotification]);
      
    } catch (error) {
      console.error('Error creating thread notifications:', error);
    }
  }
};