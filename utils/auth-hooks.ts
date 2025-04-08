'use client';

import { createClient } from '@/utils/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { saveSessionToCache, getSessionFromCache, clearSessionCache } from './session-cache';
import { withTimeout } from './promise-helpers';

// Constantes para configuración
const SESSION_TIMEOUT_MS = 5000; // 5 segundos
const ADMIN_CHECK_TIMEOUT_MS = 3000; // 3 segundos
const SESSION_REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos
const MAX_CONSECUTIVE_FAILURES = 3;

export function useAuth() {
  // Estados granulares para mejor control
  const [user, setUser] = useState<User | null>(null);
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Estados de carga separados
  const [authLoading, setAuthLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  
  // Referencias para gestión de estado
  const lastRefreshedRef = useRef<number>(0);
  const consecutiveFailuresRef = useRef<number>(0);
  const isCheckingSessionRef = useRef<boolean>(false);
  
  const router = useRouter();
  const supabase = createClient();

  // Recuperar sesión con timeout para evitar bloqueos
  const getSessionWithTimeout = useCallback(async (): Promise<Session | null> => {
    try {
      const result = await withTimeout(
        supabase.auth.getSession(),
        SESSION_TIMEOUT_MS,
        'Obtención de sesión excedió el tiempo límite'
      );
      
      // Resetear contador de fallos
      consecutiveFailuresRef.current = 0;
      lastRefreshedRef.current = Date.now();
      
      return result.data.session;
    } catch (error) {
      // Incrementar contador de fallos consecutivos
      consecutiveFailuresRef.current++;
      
      // Registrar el error
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`Error en getSessionWithTimeout (intento ${consecutiveFailuresRef.current}): ${errorMsg}`);
      setAuthError(error instanceof Error ? error : new Error('Error al obtener la sesión'));
      
      // Si tenemos demasiados fallos consecutivos, limpiar la caché
      if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
        console.warn('Demasiados fallos consecutivos, limpiando caché de sesión');
        clearSessionCache();
      }
      
      return null;
    }
  }, [supabase.auth]);

  // Verificar estado de administrador con timeout
  const checkAdminStatus = useCallback(async (userId: string): Promise<boolean> => {
    setAdminLoading(true);
    
    // Crear una promesa que se rechaza después del tiempo límite
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        reject(new Error(`Timeout (${ADMIN_CHECK_TIMEOUT_MS}ms): Verificación de admin`));
      }, ADMIN_CHECK_TIMEOUT_MS);
    });
    
    try {
      // Usar Promise.race para competir entre la promesa original y el timeout
      const adminCheckResult = await Promise.race([
        supabase.rpc('is_admin'),
        timeoutPromise
      ]);
      
      // Si llegamos aquí, es porque la consulta se completó antes del timeout
      return !!adminCheckResult.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Timeout')) {
        console.warn('Verificación de admin abortada por timeout');
      } else {
        console.error('Error en verificación de admin:', error);
      }
      return false;
    } finally {
      setAdminLoading(false);
    }
  }, [supabase]);

  // Actualizar la sesión y el usuario
  const updateSessionAndUser = useCallback(async (session: Session | null) => {
    if (!isCheckingSessionRef.current) {
      isCheckingSessionRef.current = true;
      
      try {
        // Actualizar estados
        setSessionData(session);
        setUser(session?.user || null);
        
        // Verificar administrador si hay un usuario
        if (session?.user) {
          const isUserAdmin = await checkAdminStatus(session.user.id);
          setIsAdmin(isUserAdmin);
          
          // Guardar en caché
          saveSessionToCache(
            { 
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at
            }, 
            session.user,
            isUserAdmin
          );
        } else {
          setIsAdmin(false);
          clearSessionCache();
        }
        
        // Actualizar timestamp de última actualización
        lastRefreshedRef.current = Date.now();
        setAuthError(null);
      } catch (error) {
        console.error('Error actualizando sesión:', error);
        setAuthError(error instanceof Error ? error : new Error('Error actualizando sesión'));
      } finally {
        isCheckingSessionRef.current = false;
        setAuthLoading(false);
      }
    }
  }, [checkAdminStatus]);

  // Efecto para la configuración inicial y cambios de sesión
  useEffect(() => {
    // Función para obtener la sesión inicial
    const initializeAuth = async () => {
      setAuthLoading(true);
      
      // Verificar si tenemos una sesión en caché válida
      const { session: cachedSession, user: cachedUser, isAdmin: cachedIsAdmin, isValid } = getSessionFromCache();
      
      // Si tenemos datos en caché válidos, usarlos mientras verificamos con el servidor
      if (isValid && cachedUser && cachedSession) {
        console.log('Usando sesión almacenada en caché mientras verificamos con el servidor');
        setUser(cachedUser as User);
        setSessionData({
          ...cachedSession,
          user: cachedUser as User,
        } as Session);
        setIsAdmin(cachedIsAdmin);
        setAuthLoading(false);
      }
      
      try {
        // Intentar obtener la sesión actual del servidor
        const session = await getSessionWithTimeout();
        updateSessionAndUser(session);
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        
        // Si hay un error pero tenemos datos en caché, mantenemos los datos en caché
        if (!isValid || !cachedUser) {
          setAuthLoading(false);
        }
      }
    };
    
    // Inicializar autenticación
    initializeAuth();
    
    // Configurar detector de cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      updateSessionAndUser(session);
      router.refresh();
    });
    
    // Configurar detector de cambios de visibilidad
    const handleVisibilityChange = () => {
      // Solo refrescar si la página vuelve a ser visible y ha pasado un tiempo considerable
      if (
        document.visibilityState === 'visible' && 
        Date.now() - lastRefreshedRef.current > SESSION_REFRESH_INTERVAL_MS
      ) {
        console.log('Documento visible de nuevo, refrescando sesión...');
        initializeAuth();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpieza
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router, supabase.auth, updateSessionAndUser, getSessionWithTimeout]);

  // Función para cerrar sesión
  const signOut = async () => {
    // Limpiar caché primero para experiencia de usuario más rápida
    clearSessionCache();
    setUser(null);
    setSessionData(null);
    setIsAdmin(false);
    
    // Luego realizar el cierre de sesión en el servidor
    await supabase.auth.signOut();
    router.push('/sign-in');
  };

  // Función para refrescar manualmente la sesión
  const refreshSession = useCallback(async () => {
    setAuthLoading(true);
    try {
      const session = await getSessionWithTimeout();
      updateSessionAndUser(session);
      return true;
    } catch (error) {
      console.error('Error al refrescar la sesión:', error);
      setAuthLoading(false);
      return false;
    }
  }, [getSessionWithTimeout, updateSessionAndUser]);

  return {
    user,
    session: sessionData,
    signOut,
    refreshSession,
    loading: authLoading || adminLoading,
    authLoading,
    adminLoading,
    isAuthenticated: !!user,
    isAdmin,
    error: authError
  };
}
