/**
 * Cache simple (in-memory) para requests a Mapbox (forward/reverse/searchbox).
 * Reduce ráfagas en dev y en tecleo rápido; TTL corto para no “congelar” resultados.
 */

export type MapboxCacheKey = string;

type Entry<T> = {
  at: number;
  value?: T;
  inflight?: Promise<T>;
};

const CACHE_TTL_MS = 20_000;
const cache = new Map<MapboxCacheKey, Entry<any>>();

export function mapboxCacheKey(parts: Array<string | number | null | undefined>): MapboxCacheKey {
  return parts
    .map((p) => (p == null ? "" : typeof p === "number" ? p.toFixed(5) : String(p)))
    .join("|");
}

export async function mapboxCached<T>(
  key: MapboxCacheKey,
  fn: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && now - existing.at < CACHE_TTL_MS) {
    if ("value" in existing) return existing.value as T;
    if (existing.inflight) return await existing.inflight;
  }

  const inflight = fn();
  cache.set(key, { at: now, inflight });
  try {
    const value = await inflight;
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch (e) {
    cache.delete(key);
    throw e;
  }
}

