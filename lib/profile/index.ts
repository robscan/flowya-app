import { supabase } from '../supabase';

export type ProfileRow = {
  id: string;
  /** Copia del email en auth.users; rellenada por triggers (migración 028). */
  email: string | null;
  display_name: string | null;
  /** Ruta en bucket `profile-avatars` (p. ej. `{user_id}/avatar.jpg`). */
  avatar_storage_path: string | null;
  /**
   * Preferencia de compartir fotos.
   * - null: no decidido (mostrar modal antes del primer upload)
   * - true: fotos públicas
   * - false: fotos privadas
   */
  share_photos_with_world: boolean | null;
  created_at: string;
  updated_at: string;
  /** Última actividad en app (migración 029). No mostrar en UI de cuenta; uso analítico vía DB (OL-METRICS-001). */
  last_activity_at: string | null;
};

const PROFILE_COLUMNS_BASE =
  'id, email, display_name, avatar_storage_path, created_at, updated_at, last_activity_at';
const PROFILE_COLUMNS_WITH_PHOTO_PREF = `${PROFILE_COLUMNS_BASE}, share_photos_with_world`;

let myProfileRevision = 0;
const myProfileRevisionListeners = new Set<() => void>();

export function subscribeMyProfileRevision(onChange: () => void): () => void {
  myProfileRevisionListeners.add(onChange);
  return () => myProfileRevisionListeners.delete(onChange);
}

export function getMyProfileRevisionSnapshot(): number {
  return myProfileRevision;
}

export function bumpMyProfileRevision(): void {
  myProfileRevision += 1;
  myProfileRevisionListeners.forEach((cb) => cb());
}

function isMissingColumnError(err: unknown, columnName: string): boolean {
  const msg =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message?: unknown }).message ?? '')
      : String(err ?? '');
  return msg.toLowerCase().includes(`column`) && msg.includes(columnName);
}

function normalizeProfileRow(r: any): ProfileRow {
  return {
    id: String(r?.id ?? ''),
    email: r?.email != null ? String(r.email) : null,
    display_name: r?.display_name != null ? String(r.display_name) : null,
    avatar_storage_path: r?.avatar_storage_path != null ? String(r.avatar_storage_path) : null,
    share_photos_with_world:
      typeof r?.share_photos_with_world === 'boolean' ? r.share_photos_with_world : null,
    created_at: String(r?.created_at ?? ''),
    updated_at: String(r?.updated_at ?? ''),
    last_activity_at: r?.last_activity_at != null ? String(r.last_activity_at) : null,
  };
}

/**
 * Perfil del usuario autenticado (tabla `profiles`). Sin sesión o usuario anónimo → null.
 */
export async function fetchMyProfile(): Promise<{
  data: ProfileRow | null;
  error: Error | null;
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user || user.is_anonymous) {
    return { data: null, error: null };
  }

  // Backward compatible: si el remoto aún no tiene columnas nuevas, reintentar con el select base.
  const attempt = async (columns: string) =>
    await supabase.from('profiles').select(columns).eq('id', user.id).maybeSingle();

  let res = await attempt(PROFILE_COLUMNS_WITH_PHOTO_PREF);
  if (res.error && isMissingColumnError(res.error, 'share_photos_with_world')) {
    res = await attempt(PROFILE_COLUMNS_BASE);
  }

  if (res.error) {
    return { data: null, error: new Error(res.error.message) };
  }
  return { data: res.data ? normalizeProfileRow(res.data) : null, error: null };
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
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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

/**
 * Actualiza solo columnas permitidas; requiere usuario autenticado no anónimo.
 */
export async function updateMyProfile(patch: {
  display_name?: string | null;
  avatar_storage_path?: string | null;
  share_photos_with_world?: boolean | null;
}, options?: {
  /** Si true, intenta devolver el perfil completo; si faltan columnas en remoto, cae al base. */
  selectFullProfile?: boolean;
}): Promise<{ data: ProfileRow | null; error: Error | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user || user.is_anonymous) {
    return { data: null, error: new Error('Sesión requerida') };
  }

  const wantSelect = options?.selectFullProfile !== false;
  if (!wantSelect) {
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
    if (error) return { data: null, error: new Error(error.message) };
    bumpMyProfileRevision();
    return { data: null, error: null };
  }

  const attempt = async (columns: string) =>
    await supabase.from('profiles').update(patch).eq('id', user.id).select(columns).maybeSingle();

  let res = await attempt(PROFILE_COLUMNS_WITH_PHOTO_PREF);
  if (res.error && isMissingColumnError(res.error, 'share_photos_with_world')) {
    res = await attempt(PROFILE_COLUMNS_BASE);
  }

  if (res.error) {
    return { data: null, error: new Error(res.error.message) };
  }
  bumpMyProfileRevision();
  return { data: res.data ? normalizeProfileRow(res.data) : null, error: null };
}
