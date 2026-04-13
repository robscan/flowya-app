import { getCurrentLocale } from '@/lib/i18n/locale-config';
import { supabase } from '../supabase';

export type ProfileRow = {
  id: string;
  /** Copia del email en auth.users; rellenada por triggers (migración 028). */
  email: string | null;
  display_name: string | null;
  /** Ruta en bucket `profile-avatars` (p. ej. `{user_id}/avatar.jpg`). */
  avatar_storage_path: string | null;
  created_at: string;
  updated_at: string;
  /** Última actividad registrada en la app (migración 029). */
  last_activity_at: string | null;
};

const PROFILE_COLUMNS =
  'id, email, display_name, avatar_storage_path, created_at, updated_at, last_activity_at';

/**
 * Perfil del usuario autenticado (tabla `profiles`). Sin sesión o usuario anónimo → null.
 */
export async function fetchMyProfile(): Promise<{
  data: ProfileRow | null;
  error: Error | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as ProfileRow | null, error: null };
}

const LAST_ACTIVITY_TOUCH_INTERVAL_MS = 10 * 60 * 1000;

let lastActivityClientThrottleAt = 0;

/**
 * Marca `last_activity_at = now()` en el perfil del usuario autenticado.
 * Throttle en cliente (~10 min) para no escribir en cada foco del mapa.
 */
export async function touchMyProfileLastActivity(options?: {
  bypassThrottle?: boolean;
}): Promise<{ ok: boolean }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) {
    return { ok: false };
  }
  const now = Date.now();
  if (!options?.bypassThrottle && now - lastActivityClientThrottleAt < LAST_ACTIVITY_TOUCH_INTERVAL_MS) {
    return { ok: true };
  }
  lastActivityClientThrottleAt = now;

  const { error } = await supabase
    .from('profiles')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    return { ok: false };
  }
  return { ok: true };
}

/** Etiqueta legible para UI (cuenta, etc.). */
export function formatProfileLastActivity(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat(getCurrentLocale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/**
 * Actualiza solo columnas permitidas; requiere usuario autenticado no anónimo.
 */
export async function updateMyProfile(patch: {
  display_name?: string | null;
  avatar_storage_path?: string | null;
}): Promise<{ data: ProfileRow | null; error: Error | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) {
    return { data: null, error: new Error('Sesión requerida') };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as ProfileRow | null, error: null };
}
