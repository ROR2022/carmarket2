'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Notification } from '@/services/notification';
//import { NotificationService } from '@/services/notification';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/utils/auth-hooks';
import axios from 'axios';

/* interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  created_at: string;
} */

export function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await axios.get('/api/notifications');
        const { data } = response;
        setUnreadCount(data.length);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading notification count:', error);
        setIsLoading(false);
      }
    };

    loadUnreadCount();

    // Actualizar cada minuto
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cargar las notificaciones al abrir el dropdown
  const handleOpenChange = async (open: boolean) => {
    setIsDropdownOpen(open);
    
    if (open && notifications.length === 0 && user) {
      try {
        const response = await axios.get('/api/notifications');
        const { data } = response;
        // Map from service format to component format
        const formattedNotifs = data.map((n: Notification) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          link: n.link,
          created_at: n.createdAt
        }));
        setNotifications(formattedNotifs);
      } catch (error) {
        console.error('Error loading notifications:', error);
        toast.error('No pudimos cargar tus notificaciones');
      }
    }
  };

  // Manejar clic en una notificación
  const handleNotificationClick = async (notification: Notification) => {
    if (!user) return;
    
    try {
      // Marcar como leída
      //await NotificationService.markAsRead(notification.id);
      await axios.post('/api/notifications', {
        methodSelected: 'markAsRead',
        sentParams: {
          notificationId: notification.id
        }
      });
      
      // Actualizar conteo y lista
      setUnreadCount(prev => prev !== null ? prev - 1 : 0);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      // Navegar al link si existe
      if (notification.link) {
        router.push(notification.link);
      }
      
      // Cerrar dropdown
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      //await NotificationService.markAllAsRead(user.id);
      await axios.post('/api/notifications', {
        methodSelected: 'markAllAsRead',
        sentParams: {}
      });
      setUnreadCount(0);
      setNotifications([]);
      toast.success('Notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Formatear la fecha para mostrar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {isLoading ? (
            <Skeleton className="h-5 w-5 rounded-full absolute -top-1 -right-1" />
          ) : unreadCount && unreadCount > 0 ? (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-medium">Notificaciones</h3>
          {unreadCount && unreadCount > 0 ? (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs" 
              onClick={markAllAsRead}
            >
              Marcar todas como leídas
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No tienes notificaciones nuevas
          </div>
        ) : (
          notifications.map(notification => (
            <DropdownMenuItem 
              key={notification.id}
              className="p-3 cursor-pointer"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{notification.message}</p>
              </div>
            </DropdownMenuItem>
          ))
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="p-2 text-center"
              onClick={() => router.push('/notifications')}
            >
              Ver todas las notificaciones
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 