/**
 * Formatea un número como moneda en pesos argentinos.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formatea un número como kilometraje.
 */
export function formatMileage(mileage: number): string {
  return `${mileage.toLocaleString('es-AR')} km`;
}

/**
 * Formatea una fecha ISO en formato local.
 */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formatea una fecha como relativa a la hora actual (ej: "hace 5 minutos").
 */
export function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) {
    return 'hace un momento';
  } else if (diffMins < 60) {
    return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffHours < 24) {
    return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  } else if (diffDays < 30) {
    return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  } else if (diffMonths < 12) {
    return `hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
  } else {
    return formatDate(isoDate);
  }
}

/**
 * Capitaliza la primera letra de un string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formatea un timestamp como tiempo relativo (hace X minutos, segundos, etc.)
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  
  // Menos de un minuto
  if (diffMs < 60 * 1000) {
    return 'hace unos segundos';
  }
  
  // Minutos
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) {
    return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  // Horas
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 24) {
    return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  
  // Días
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
} 