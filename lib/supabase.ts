import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let cachedClient: SupabaseClient | null = null;

export function hasSupabaseClientEnv(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function createSupabaseBrowserClient(): SupabaseClient {
  if (!hasSupabaseClientEnv()) {
    throw new Error(
      'Supabase client env missing: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Client routes that need Supabase must run with the anon web config available.',
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: supabaseFetch },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  cachedClient = createSupabaseBrowserClient();
  return cachedClient;
}

function getSupabaseClientRecord(): Record<PropertyKey, unknown> {
  return getSupabaseClient() as unknown as Record<PropertyKey, unknown>;
}

/**
 * En web el navegador puede reutilizar respuestas GET del REST de PostgREST (p. ej. KPIs de perfil).
 * `no-store` evita datos obsoletos sin afectar a iOS/Android (no usamos `window`).
 */
const supabaseFetch: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    cache: typeof window !== 'undefined' ? 'no-store' : init?.cache,
  });

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClientRecord();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
  set(_target, prop, value) {
    const client = getSupabaseClientRecord();
    client[prop] = value;
    return true;
  },
  has(_target, prop) {
    return prop in getSupabaseClientRecord();
  },
  ownKeys() {
    return Reflect.ownKeys(getSupabaseClient() as object);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(getSupabaseClient() as object, prop);
  },
});
