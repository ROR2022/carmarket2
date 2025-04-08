/**
 * Ejecuta una promesa con un límite de tiempo.
 * Si la promesa no se resuelve dentro del tiempo especificado, se rechaza con un error de timeout.
 * 
 * @param promise La promesa a ejecutar
 * @param timeoutMs Tiempo límite en milisegundos
 * @param errorMessage Mensaje de error opcional para el timeout
 * @returns Promesa con timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  errorMessage: string = 'La operación ha excedido el tiempo límite'
): Promise<T> {
  // Crear una promesa que se rechaza después del tiempo límite
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      reject(new Error(`Timeout (${timeoutMs}ms): ${errorMessage}`));
    }, timeoutMs);
  });

  // Usar Promise.race para competir entre la promesa original y el timeout
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Ejecuta una promesa con un límite de tiempo, pero devuelve un valor por defecto en caso de error.
 * 
 * @param promise La promesa a ejecutar
 * @param defaultValue Valor por defecto a devolver en caso de error
 * @param timeoutMs Tiempo límite en milisegundos
 * @returns La resolución de la promesa o el valor por defecto
 */
export async function withTimeoutOrDefault<T>(
  promise: Promise<T>,
  defaultValue: T,
  timeoutMs: number = 5000
): Promise<T> {
  try {
    return await withTimeout(promise, timeoutMs);
  } catch (error) {
    console.warn(`Fallback a valor por defecto debido a error: ${error instanceof Error ? error.message : 'Desconocido'}`);
    return defaultValue;
  }
}

/**
 * Intenta ejecutar una promesa con reintentos en caso de fallo.
 * 
 * @param promiseFactory Función que crea la promesa a ejecutar
 * @param maxRetries Número máximo de reintentos
 * @param delayMs Retraso base entre reintentos (en milisegundos)
 * @param backoffFactor Factor multiplicador para el retroceso exponencial
 * @returns Promesa con reintentos
 */
export async function withRetry<T>(
  promiseFactory: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  backoffFactor: number = 2
): Promise<T> {
  let lastError: Error | unknown;
  let currentDelay = delayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // En el primer intento (attempt = 0) no hay retraso
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoffFactor; // Retroceso exponencial
      }
      
      return await promiseFactory();
    } catch (error) {
      lastError = error;
      console.warn(`Intento ${attempt + 1}/${maxRetries + 1} fallido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  throw lastError || new Error('Todos los reintentos fallaron');
} 