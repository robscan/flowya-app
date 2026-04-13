import { supabase } from '../supabase';

export type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

const PROFILE_COLUMNS = 'id, display_name, avatar_url, created_at, updated_at';

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

/**
 * Actualiza solo columnas permitidas; requiere usuario autenticado no anónimo.
 */
export async function updateMyProfile(patch: {
  display_name?: string | null;
  avatar_url?: string | null;
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
