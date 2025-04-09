'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Notification } from '@/services/notification';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { CheckCheck, Bell, BellOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/utils/auth-hooks';
import axios from 'axios';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        if (!isAuthenticated || !user) {
          router.push('/sign-in');
          return;
        }

        setIsLoading(true);
        //const allNotifications = await NotificationService.getAllNotifications(user.id);
        const response = await axios.post('/api/notifications',{
          methodSelected:"getNotifications",
          sentParams:{
            userId:user.id
          }
        });
        const allNotifications = response.data;
        setNotifications(allNotifications);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading notifications:', error);
        toast.error('No pudimos cargar tus notificaciones');
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [isAuthenticated, router, toast, user]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        //await NotificationService.markAsRead(notification.id);
        await axios.post('/api/notifications',{
          methodSelected:"markAsRead",
          sentParams:{
            notificationId:notification.id
          }
        });
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user) return;
      //await NotificationService.markAllAsRead(user.id);
      await axios.post('/api/notifications',{
        methodSelected:"markAllAsRead",
        sentParams:{
          userId:user.id
        }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('Todas las notificaciones han sido marcadas como leídas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Ocurrió un error al marcar las notificaciones como leídas');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM 'a las' HH:mm", { locale: es });
  };

  // Filtrar notificaciones según la pestaña activa
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') {
      return !notification.read;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isAuthenticated || !user) {
    return null; // Evita renderizado durante redireccionamiento
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-4xl">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground mt-1">
            Revisa todas tus notificaciones y actualizaciones
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={markAllAsRead}
            className="md:self-end flex gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all" className="flex gap-2 items-center">
              <Bell className="h-4 w-4" />
              Todas
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex gap-2 items-center">
              <BellOff className="h-4 w-4" />
              No leídas
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          {renderNotificationList(filteredNotifications, isLoading)}
        </TabsContent>

        <TabsContent value="unread" className="mt-0">
          {renderNotificationList(filteredNotifications, isLoading)}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderNotificationList(notifications: Notification[], isLoading: boolean) {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="mb-4">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardContent>
        </Card>
      ));
    }

    if (notifications.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No hay notificaciones</h3>
            <p className="text-muted-foreground text-center mt-1">
              {activeTab === 'unread' 
                ? 'No tienes notificaciones sin leer en este momento'
                : 'No tienes notificaciones en este momento'}
            </p>
          </CardContent>
        </Card>
      );
    }

    return notifications.map((notification) => (
      <Card 
        key={notification.id} 
        className={`mb-4 transition-colors ${!notification.read ? 'bg-muted/40' : ''} ${notification.link ? 'cursor-pointer hover:bg-muted/60' : ''}`}
        onClick={() => notification.link && handleNotificationClick(notification)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{notification.title}</CardTitle>
            {!notification.read && (
              <Badge variant="secondary">Nueva</Badge>
            )}
          </div>
          <CardDescription>
            {formatDate(notification.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>{notification.message}</p>
        </CardContent>
        {notification.link && (
          <CardFooter className="pt-0">
            <Button variant="link" className="p-0">
              {!notification.read ? 'Ver detalle' : 'Ver de nuevo'}
            </Button>
          </CardFooter>
        )}
      </Card>
    ));
  }
} 