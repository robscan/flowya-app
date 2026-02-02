/**
 * Scope D: persistencia de pins por usuario.
 * Un pin por (user_id, spot_id). Estados: to_visit | visited.
 * Requiere sesión (auth anónimo o autenticado).
 */

import { supabase } from '@/lib/supabase';

export type PinStatus = 'to_visit' | 'visited';

/** Obtiene el user_id actual (anon o autenticado). Devuelve null si no hay sesión. */
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Obtiene el pin del usuario para un spot. null si no existe. */
export async function getPin(spotId: string): Promise<PinStatus | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('pins')
    .select('status')
    .eq('spot_id', spotId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.status as PinStatus;
}

/** Carga el estado de pin para varios spots. Devuelve Map<spotId, status>. */
export async function getPinsForSpots(
  spotIds: string[]
): Promise<Map<string, PinStatus>> {
  const userId = await getCurrentUserId();
  const map = new Map<string, PinStatus>();
  if (!userId || spotIds.length === 0) return map;
  const { data, error } = await supabase
    .from('pins')
    .select('spot_id, status')
    .eq('user_id', userId)
    .in('spot_id', spotIds);
  if (error || !data) return map;
  for (const row of data) {
    map.set(row.spot_id, row.status as PinStatus);
  }
  return map;
}

/**
 * Crea o actualiza el pin del usuario para el spot.
 * Un solo pin por (user_id, spot_id): upsert por status.
 * Devuelve el nuevo status o null si falló (no rompe UI, mantener estado previo).
 */
export async function setPinStatus(
  spotId: string,
  status: PinStatus
): Promise<PinStatus | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('pins')
    .upsert(
      { spot_id: spotId, user_id: userId, status },
      { onConflict: ['user_id', 'spot_id'] }
    )
    .select('status')
    .single();
  if (error || !data) return null;
  return data.status as PinStatus;
}

/**
 * Elimina el pin del usuario para el spot (desactivar).
 * Devuelve true si se eliminó correctamente.
 */
export async function removePin(spotId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;
  const { error } = await supabase
    .from('pins')
    .delete()
    .eq('spot_id', spotId)
    .eq('user_id', userId);
  return !error;
}

/**
 * Calcula el siguiente estado al pulsar "Guardar pin" (cuando no se desactiva):
 * sin pin → to_visit; to_visit → visited.
 * Si current === 'visited', la pantalla llama removePin y no usa este valor.
 */
export function nextPinStatus(current: PinStatus | null): PinStatus {
  if (!current) return 'to_visit';
  return 'visited';
}
