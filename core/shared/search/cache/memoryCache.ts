/**
 * core/shared/search/cache/memoryCache.ts — Cache in-memory para Search.
 * Extraído de useSearchControllerV2; implementa la semántica de SearchCache
 * con shape SearchStrategyResult para compatibilidad con el hook actual.
 */

/** Shape que guarda la cache (compatible con SearchStrategyResult del hook). */
export type CachedSearchPayload<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CreateMemorySearchCacheOptions<T> = {
  ttlMs: number;
  maxEntries?: number;
  /** Para invalidateSpotId: extrae spotId de un item (ej. item.id o item.spotId). */
  getSpotId?: (item: T) => string | undefined;
};

type CacheEntry<T> = { data: CachedSearchPayload<T>; ts: number };

/**
 * Crea una cache in-memory con TTL, maxEntries opcional e invalidateSpotId.
 * Compatible con useSearchControllerV2.
 */
export function createMemorySearchCache<T>(
  opts: CreateMemorySearchCacheOptions<T>
): {
  get(key: string): CachedSearchPayload<T> | null;
  set(key: string, value: CachedSearchPayload<T>): void;
  clear(prefix?: string): void;
  invalidateSpotId(spotId: string): void;
  stats(): { size: number };
} {
  const { ttlMs, maxEntries, getSpotId } = opts;
  const map = new Map<string, CacheEntry<T>>();

  function get(key: string): CachedSearchPayload<T> | null {
    const e = map.get(key);
    if (!e) return null;
    if (Date.now() - e.ts > ttlMs) {
      map.delete(key);
      return null;
    }
    return e.data;
  }

  function set(key: string, value: CachedSearchPayload<T>) {
    if (
      maxEntries !== undefined &&
      map.size >= maxEntries &&
      !map.has(key)
    ) {
      const firstKey = map.keys().next().value;
      if (firstKey !== undefined) map.delete(firstKey);
    }
    map.set(key, { data: value, ts: Date.now() });
  }

  function clear(prefix?: string) {
    if (prefix === undefined) {
      map.clear();
      return;
    }
    for (const k of Array.from(map.keys())) {
      if (k.startsWith(prefix)) map.delete(k);
    }
  }

  function invalidateSpotId(spotId: string) {
    if (!getSpotId) return;
    for (const [k, entry] of map) {
      const hasSpot = entry.data.items.some(
        (item) => getSpotId(item) === spotId
      );
      if (hasSpot) map.delete(k);
    }
  }

  function stats() {
    return { size: map.size };
  }

  return { get, set, clear, invalidateSpotId, stats };
}
