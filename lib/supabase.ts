import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * En web el navegador puede reutilizar respuestas GET del REST de PostgREST (p. ej. KPIs de perfil).
 * `no-store` evita datos obsoletos sin afectar a iOS/Android (no usamos `window`).
 */
const supabaseFetch: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    cache: typeof window !== 'undefined' ? 'no-store' : init?.cache,
  });

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: supabaseFetch },
});
