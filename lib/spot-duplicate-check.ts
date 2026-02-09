/**
 * Scope G: prevención de duplicados al crear spots.
 * Regla: mismo título normalizado + ubicación dentro del radio (metros).
 * Sin índices nuevos; consulta por bbox y filtro en cliente. Fail-open si falla la validación.
 */

import { supabase } from '@/lib/supabase';

/** Radio por defecto para considerar duplicado (metros). */
export const DEFAULT_DUPLICATE_RADIUS_METERS = 150;

/**
 * Normaliza el título para comparación:
 * lowercase, trim, quitar acentos, colapsar espacios internos.
 * Reutilizable y consistente.
 */
export function normalizeSpotTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return '';
  const withoutAccents = trimmed
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  const lower = withoutAccents.toLowerCase();
  return lower.replace(/\s+/g, ' ').trim();
}

/** Distancia haversine entre dos puntos en metros (radio terrestre ≈ 6_371_000 m). */
function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Aproximación: 1 grado ≈ 111 km en latitud; en longitud depende de lat.
 * Para ~100 m usamos ~0.001 grados (margen para no traer de más).
 */
function bboxDelta(radiusMeters: number): number {
  const metersPerDegreeLat = 111_320;
  return radiusMeters / metersPerDegreeLat;
}

export type DuplicateCheckResult =
  | { duplicate: false }
  | { duplicate: true; existingTitle: string; existingSpotId: string };

/**
 * Comprueba si ya existe un spot duplicado (mismo título normalizado y dentro del radio).
 * Consulta por bbox para no traer toda la tabla; filtra por distancia haversine y título en cliente.
 * Si la consulta falla (red, etc.): devuelve { duplicate: false } (fail-open).
 */
export async function checkDuplicateSpot(
  title: string,
  latitude: number,
  longitude: number,
  radiusMeters: number = DEFAULT_DUPLICATE_RADIUS_METERS
): Promise<DuplicateCheckResult> {
  const normalized = normalizeSpotTitle(title);
  if (!normalized) return { duplicate: false };

  const delta = bboxDelta(radiusMeters * 4);
  const latMin = latitude - delta;
  const latMax = latitude + delta;
  const lonMin = longitude - delta;
  const lonMax = longitude + delta;

  const { data, error } = await supabase
    .from('spots')
    .select('id, title, latitude, longitude')
    .eq('is_hidden', false)
    .gte('latitude', latMin)
    .lte('latitude', latMax)
    .gte('longitude', lonMin)
    .lte('longitude', lonMax);

  if (error || !data) return { duplicate: false };

  const normalizedInput = normalized;
  for (const row of data) {
    const dist = haversineDistanceMeters(
      latitude,
      longitude,
      row.latitude,
      row.longitude
    );
    if (dist <= radiusMeters && normalizeSpotTitle(row.title) === normalizedInput) {
      return { duplicate: true, existingTitle: row.title, existingSpotId: row.id };
    }
  }
  return { duplicate: false };
}

export type SpotNearby = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
};

/**
 * Devuelve spots existentes dentro del radio (para visualización en Create Spot).
 * Misma consulta por bbox y filtro haversine; no filtra por título.
 * Si la consulta falla: devuelve [] (fail-open).
 */
export async function getSpotsNearby(
  latitude: number,
  longitude: number,
  radiusMeters: number = DEFAULT_DUPLICATE_RADIUS_METERS * 1.5
): Promise<SpotNearby[]> {
  const delta = bboxDelta(radiusMeters * 2);
  const latMin = latitude - delta;
  const latMax = latitude + delta;
  const lonMin = longitude - delta;
  const lonMax = longitude + delta;

  const { data, error } = await supabase
    .from('spots')
    .select('id, title, latitude, longitude')
    .eq('is_hidden', false)
    .gte('latitude', latMin)
    .lte('latitude', latMax)
    .gte('longitude', lonMin)
    .lte('longitude', lonMax);

  if (error || !data) return [];

  const result: SpotNearby[] = [];
  for (const row of data) {
    const dist = haversineDistanceMeters(
      latitude,
      longitude,
      row.latitude,
      row.longitude
    );
    if (dist <= radiusMeters) {
      result.push({
        id: row.id,
        title: row.title,
        latitude: row.latitude,
        longitude: row.longitude,
      });
    }
  }
  return result;
}
