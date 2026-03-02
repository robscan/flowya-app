/**
 * Scope D: persistencia de pins por usuario.
 * Fuente de verdad: saved + visited (independientes).
 * TODO(LEGACY): PinStatus/getPin/setPinStatus/removePin se eliminarán cuando SpotDetail legacy y MapScreenV0 se retiren.
 */

import { supabase } from '@/lib/supabase';

/** Estado de pin por spot: dos flags independientes. */
export type PinState = {
  saved: boolean;
  visited: boolean;
};

/** @deprecated Usar PinState. Enum exclusivo legacy. */
export type PinStatus = 'to_visit' | 'visited';

/** Deriva PinStatus legacy desde PinState (visited tiene prioridad). Para UI legacy únicamente. */
export function deriveLegacyPinStatus(state: PinState | null | undefined): PinStatus | null {
  if (!state || (!state.saved && !state.visited)) return null;
  return state.visited ? 'visited' : 'to_visit';
}

export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Estado del pin del usuario para un spot. null si no hay fila (ni saved ni visited). */
export async function getPinState(spotId: string): Promise<PinState | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('pins')
    .select('saved, visited')
    .eq('spot_id', spotId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return { saved: Boolean(data.saved), visited: Boolean(data.visited) };
}

/** Carga saved/visited para varios spots. Map<spotId, PinState>. */
export async function getPinsForSpots(spotIds: string[]): Promise<Map<string, PinState>> {
  const userId = await getCurrentUserId();
  const map = new Map<string, PinState>();
  if (!userId || spotIds.length === 0) return map;
  const { data, error } = await supabase
    .from('pins')
    .select('spot_id, saved, visited')
    .eq('user_id', userId)
    .in('spot_id', spotIds);
  if (error || !data) return map;
  for (const row of data) {
    map.set(row.spot_id, {
      saved: Boolean(row.saved),
      visited: Boolean(row.visited),
    });
  }
  return map;
}

/** @deprecated Para v0/legacy. Devuelve Map<spotId, PinStatus> derivado de getPinsForSpots. */
export async function getPinsForSpotsLegacy(
  spotIds: string[]
): Promise<Map<string, PinStatus>> {
  const stateMap = await getPinsForSpots(spotIds);
  const out = new Map<string, PinStatus>();
  for (const [id, state] of stateMap) {
    const leg = deriveLegacyPinStatus(state);
    if (leg !== null) out.set(id, leg);
  }
  return out;
}

/**
 * Activa o desactiva "Guardado" para el spot.
 * Devuelve el nuevo PinState o null si falló.
 */
export async function setSaved(spotId: string, value: boolean): Promise<PinState | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const current = await getPinState(spotId);
  const nextSaved = value;
  const nextVisited = current?.visited ?? false;
  if (!nextSaved && !nextVisited) {
    const ok = await removePin(spotId);
    return ok ? null : null; // null = "no pin" = success
  }
  const statusLegacy = nextVisited ? 'visited' : 'to_visit';
  const { data, error } = await supabase
    .from('pins')
    .upsert(
      {
        spot_id: spotId,
        user_id: userId,
        saved: nextSaved,
        visited: nextVisited,
        status: statusLegacy,
      },
      { onConflict: ['user_id', 'spot_id'] }
    )
    .select('saved, visited')
    .single();
  if (error || !data) return null;
  return { saved: Boolean(data.saved), visited: Boolean(data.visited) };
}

/**
 * Activa o desactiva "Visitado" para el spot.
 * Devuelve el nuevo PinState o null si falló.
 */
export async function setVisited(spotId: string, value: boolean): Promise<PinState | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const current = await getPinState(spotId);
  const nextSaved = current?.saved ?? false;
  const nextVisited = value;
  if (!nextSaved && !nextVisited) {
    const ok = await removePin(spotId);
    return ok ? null : null;
  }
  const statusLegacy = nextVisited ? 'visited' : 'to_visit';
  const { data, error } = await supabase
    .from('pins')
    .upsert(
      {
        spot_id: spotId,
        user_id: userId,
        saved: nextSaved,
        visited: nextVisited,
        status: statusLegacy,
      },
      { onConflict: ['user_id', 'spot_id'] }
    )
    .select('saved, visited')
    .single();
  if (error || !data) return null;
  return { saved: Boolean(data.saved), visited: Boolean(data.visited) };
}

/**
 * Persiste ambos flags del pin en una sola operación.
 * Regla canónica: si `visited=true`, `saved` se fuerza a `false` para evitar estados ambiguos en UI.
 * Devuelve el nuevo PinState o null si falló.
 */
export async function setPinState(
  spotId: string,
  next: PinState
): Promise<PinState | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const normalized: PinState = next.visited
    ? { saved: false, visited: true }
    : { saved: Boolean(next.saved), visited: false };

  if (!normalized.saved && !normalized.visited) {
    const ok = await removePin(spotId);
    return ok ? normalized : null;
  }

  const statusLegacy: PinStatus = normalized.visited ? 'visited' : 'to_visit';
  const { data, error } = await supabase
    .from('pins')
    .upsert(
      {
        spot_id: spotId,
        user_id: userId,
        saved: normalized.saved,
        visited: normalized.visited,
        status: statusLegacy,
      },
      { onConflict: ['user_id', 'spot_id'] }
    )
    .select('saved, visited')
    .single();
  if (error || !data) return null;
  return { saved: Boolean(data.saved), visited: Boolean(data.visited) };
}

/** Elimina el pin del usuario para el spot. Devuelve true si se eliminó. */
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

// --- Legacy (v0 / SpotDetail): mantener hasta retirar esas pantallas ---

/** @deprecated Usar getPinState. Devuelve status legacy derivado. */
export async function getPin(spotId: string): Promise<PinStatus | null> {
  const state = await getPinState(spotId);
  return deriveLegacyPinStatus(state);
}

/** @deprecated Usar setSaved/setVisited. Fuerza estado exclusivo (un solo flag activo). */
export async function setPinStatus(
  spotId: string,
  status: PinStatus
): Promise<PinStatus | null> {
  const saved = status === 'to_visit';
  const visited = status === 'visited';
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('pins')
    .upsert(
      {
        spot_id: spotId,
        user_id: userId,
        saved,
        visited,
        status,
      },
      { onConflict: ['user_id', 'spot_id'] }
    )
    .select('saved, visited')
    .single();
  if (error || !data) return null;
  return data.visited ? 'visited' : data.saved ? 'to_visit' : null;
}

/** @deprecated Calcula siguiente status legacy (exclusivo). */
export function nextPinStatus(current: PinStatus | null): PinStatus {
  if (!current) return 'to_visit';
  return 'visited';
}
