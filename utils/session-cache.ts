// Constantes para la gestión de cache
const SESSION_CACHE_KEY = 'car_marketplace_session';
const USER_CACHE_KEY = 'car_marketplace_user';
const ADMIN_STATUS_KEY = 'car_marketplace_is_admin';
const CACHE_EXPIRY_KEY = 'car_marketplace_cache_expiry';
const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

// Interfaces para typing
interface CachedUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  created_at?: string;
}

interface CachedSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

// Guardar sesión en cache
export function saveSessionToCache(
  session: CachedSession | null, 
  user: CachedUser | null, 
  isAdmin: boolean = false,
  ttl: number = DEFAULT_CACHE_TTL
): void {
  try {
    if (typeof window === 'undefined') return; // Verificar que estamos en el cliente
    
    // Calcular tiempo de expiración
    const expiryTime = Date.now() + ttl;
    
    // Guardar datos en localStorage
    if (session) localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session));
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    localStorage.setItem(ADMIN_STATUS_KEY, JSON.stringify(isAdmin));
    localStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString());
    
    console.log('[SessionCache] Sesión guardada en caché');
  } catch (error) {
    console.error('[SessionCache] Error al guardar sesión en caché:', error);
  }
}

// Obtener sesión desde cache
export function getSessionFromCache(): { 
  session: CachedSession | null; 
  user: CachedUser | null; 
  isAdmin: boolean;
  isValid: boolean;
} {
  try {
    if (typeof window === 'undefined') {
      // Estamos en el servidor, no hay localStorage
      return { session: null, user: null, isAdmin: false, isValid: false };
    }
    
    // Verificar si la caché ha expirado
    const expiryTime = localStorage.getItem(CACHE_EXPIRY_KEY);
    const isValid = expiryTime ? parseInt(expiryTime) > Date.now() : false;
    
    if (!isValid) {
      console.log('[SessionCache] La caché ha expirado');
      return { session: null, user: null, isAdmin: false, isValid: false };
    }
    
    // Recuperar datos desde localStorage
    const sessionJson = localStorage.getItem(SESSION_CACHE_KEY);
    const userJson = localStorage.getItem(USER_CACHE_KEY);
    const isAdminJson = localStorage.getItem(ADMIN_STATUS_KEY);
    
    const session = sessionJson ? JSON.parse(sessionJson) : null;
    const user = userJson ? JSON.parse(userJson) : null;
    const isAdmin = isAdminJson ? JSON.parse(isAdminJson) : false;
    
    console.log('[SessionCache] Sesión recuperada desde caché');
    return { session, user, isAdmin, isValid };
  } catch (error) {
    console.error('[SessionCache] Error al recuperar sesión desde caché:', error);
    return { session: null, user: null, isAdmin: false, isValid: false };
  }
}

// Limpiar cache de sesión
export function clearSessionCache(): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(SESSION_CACHE_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
    localStorage.removeItem(ADMIN_STATUS_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
    
    console.log('[SessionCache] Caché de sesión limpiada');
  } catch (error) {
    console.error('[SessionCache] Error al limpiar caché de sesión:', error);
  }
}

// Actualizar expiración de la caché
export function refreshCacheExpiry(ttl: number = DEFAULT_CACHE_TTL): void {
  try {
    if (typeof window === 'undefined') return;
    
    const expiryTime = Date.now() + ttl;
    localStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString());
    
    console.log('[SessionCache] Expiración de caché actualizada');
  } catch (error) {
    console.error('[SessionCache] Error al actualizar expiración de caché:', error);
  }
}

// Verificar si existe una sesión en caché válida
export function hasValidCachedSession(): boolean {
  const { isValid } = getSessionFromCache();
  return isValid;
} 