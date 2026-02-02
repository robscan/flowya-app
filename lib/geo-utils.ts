/**
 * Utilidades geo: distancia Haversine y URLs de mapas externos.
 */

/** Radio de la Tierra en km (aproximado). */
const EARTH_RADIUS_KM = 6371;

/**
 * Distancia en km entre dos puntos (Haversine).
 */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Formatea distancia para UI. Ej: 1.2 → "1.2 km", 0.35 → "350 m"
 */
export function formatDistanceKm(km: number): string {
  if (km < 0.01) return '< 10 m';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/**
 * URL para abrir Google Maps con direcciones al destino.
 * Deep link: abre app si está instalada, sino web.
 */
export function getMapsDirectionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}
