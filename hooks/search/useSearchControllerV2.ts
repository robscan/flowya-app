/**
 * Search V2 controller: un solo debounce, cancelación/guard, cache TTL.
 * Contratos: stage, cursor, hasMore, fetchMore; strategy search({ query, stage, bbox, filters, cursor }).
 * Threshold 3 chars para emitir resultados.
 */

import type { SpotsStrategyProvider } from '@/core/shared/search/providers/spotsStrategyProvider';
import { createMemorySearchCache } from '@/core/shared/search/cache/memoryCache';
import { getSuggestions } from '@/lib/search/suggestions';
import { normalizeQuery } from '@/lib/search/normalize';
import { useCallback, useMemo, useRef, useState } from 'react';

const SEARCH_DEBOUNCE_MS = 300;
const CACHE_TTL_MS = 60_000; // 60s in-memory cache
const THRESHOLD_CHARS = 3;

export type SearchStage = 'viewport' | 'expanded' | 'global';

export type BBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type SearchStrategyParams = {
  query: string;
  stage: SearchStage;
  bbox: BBox | null;
  filters: unknown;
  cursor: string | null;
};

export type SearchStrategyResult<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type SearchStrategy<T> = (
  params: SearchStrategyParams
) => Promise<SearchStrategyResult<T>>;

function cacheKey(
  mode: string,
  stage: SearchStage,
  filters: unknown,
  bbox: BBox | null,
  normalizedQuery: string,
  cursor: string | null
): string {
  const b = bbox
    ? `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`
    : '';
  const f = typeof filters === 'object' && filters !== null ? JSON.stringify(filters) : String(filters);
  return `${mode}:${stage}:${f}:${b}:${normalizedQuery}:${cursor ?? ''}`;
}


export type UseSearchControllerV2Options<T> = {
  mode: 'spots' | 'places';
  isToggleable?: boolean;
  defaultOpen?: boolean;
  /** Strategy directa (places o spots legacy). */
  strategy?: SearchStrategy<T>;
  /** Provider para spots (usa execute internamente). Si se pasa, strategy se ignora para mode spots. */
  provider?: SpotsStrategyProvider;
  getBbox?: () => BBox | null;
  getFilters?: () => unknown;
  initialFilters?: unknown;
};

export type SearchSection<T> = {
  id: string;
  title: string;
  items: T[];
};

export type UseSearchControllerV2Return<T> = {
  query: string;
  setQuery: (q: string) => void;
  clear: () => void;
  results: T[];
  sections: SearchSection<T>[];
  /** S3: solo cuando mode spots, query >= 3, stage global, results.length === 0. */
  suggestions: string[];
  onSuggestionTap: (suggestion: string) => void;
  stage: SearchStage;
  cursor: string | null;
  hasMore: boolean;
  fetchMore: () => void;
  isLoading: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  open: () => void;
  close: () => void;
  onSelect: (item: T) => void;
  onCreate: () => void;
  setOnSelect: (fn: (item: T) => void) => void;
  setOnCreate: (fn: () => void) => void;
  /** Invalida cache por spotId (soft delete). No limpia resultados en pantalla. */
  invalidateSpotId: (spotId: string) => void;
};

export function useSearchControllerV2<T>({
  mode,
  isToggleable = true,
  defaultOpen = false,
  strategy: strategyProp,
  provider,
  getBbox = () => null,
  getFilters = () => null,
  initialFilters,
}: UseSearchControllerV2Options<T>): UseSearchControllerV2Return<T> {
  const strategy: SearchStrategy<T> =
    mode === 'spots' && provider
      ? (provider.execute as SearchStrategy<T>)
      : (strategyProp as SearchStrategy<T>);

  if (!strategy) {
    throw new Error('useSearchControllerV2 requires strategy or provider');
  }
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [sections, setSections] = useState<SearchSection<T>[]>([]);
  const [stage, setStage] = useState<SearchStage>('viewport');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setOpen] = useState(defaultOpen);

  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(
    createMemorySearchCache<T>({
      ttlMs: CACHE_TTL_MS,
      getSpotId: (item) =>
        (item as { id?: string }).id ?? (item as { spotId?: string }).spotId,
    })
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSelectRef = useRef<(item: T) => void>(() => {});
  const onCreateRef = useRef<() => void>(() => {});

  const setOnSelect = useCallback((fn: (item: T) => void) => {
    onSelectRef.current = fn;
  }, []);
  const setOnCreate = useCallback((fn: () => void) => {
    onCreateRef.current = fn;
  }, []);

  const runSearch = useCallback(
    async (q: string, st: SearchStage, cur: string | null, append: boolean) => {
      const filters = getFilters();
      const bbox = getBbox();
      const nq = normalizeQuery(q);
      const key = cacheKey(mode, st, filters, bbox, nq, cur);
      const cached = cacheRef.current.get(key);
      const useCache =
        cached &&
        !append &&
        !(
          mode === 'spots' &&
          st !== 'global' &&
          cur === null &&
          cached.items.length === 0
        );

      if (useCache) {
        setResults((prev) => (append ? [...prev, ...cached!.items] : cached!.items));
        setCursor(cached!.nextCursor);
        setHasMore(cached!.hasMore);
        setStage(st);
        setIsLoading(false);
        return;
      }

      const rid = ++requestIdRef.current;
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      let chaining = false;
      try {
        const out = await strategy({
          query: q.trim(),
          stage: st,
          bbox,
          filters,
          cursor: cur,
        });
        const ignoredByRace = requestIdRef.current !== rid;
        if (ignoredByRace) return;
        cacheRef.current.set(key, out);
        setResults((prev) => (append ? [...prev, ...out.items] : out.items));
        setCursor(out.nextCursor);
        setHasMore(out.hasMore);
        setStage(st);
        setSections([]);

        // Guardrail: stage solo avanza en search() inicial (cursor null, !append). fetchMore no dispara expanded/global.
        if (!append && cur === null && out.items.length === 0 && mode === 'spots') {
          if (st === 'viewport') {
            chaining = true;
            setStage('expanded');
            await runSearch(q, 'expanded', null, false);
            return;
          }
          if (st === 'expanded') {
            chaining = true;
            setStage('global');
            await runSearch(q, 'global', null, false);
            return;
          }
        }
      } finally {
        if (requestIdRef.current === rid && !chaining) setIsLoading(false);
      }
    },
    [mode, strategy, getBbox, getFilters]
  );

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const trimmed = q.trim();
      if (trimmed.length < THRESHOLD_CHARS) {
        setResults([]);
        setSections([]);
        setCursor(null);
        setHasMore(false);
        setStage('viewport');
        return;
      }
      setIsLoading(true);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        runSearch(trimmed, 'viewport', null, false);
      }, SEARCH_DEBOUNCE_MS);
    },
    [runSearch]
  );

  const clear = useCallback(() => {
    setQueryState('');
    setResults([]);
    setSections([]);
    setStage('viewport');
    setCursor(null);
    setHasMore(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const fetchMore = useCallback(() => {
    const q = query.trim();
    if (q.length < THRESHOLD_CHARS || isLoading || !hasMore || !cursor) return;
    setIsLoading(true);
    runSearch(q, stage, cursor, true);
  }, [query, stage, cursor, hasMore, isLoading, runSearch]);

  const onSelect = useCallback((item: T) => {
    onSelectRef.current(item);
  }, []);

  const onCreate = useCallback(() => {
    onCreateRef.current();
  }, []);

  const invalidateSpotId = useCallback((spotId: string) => {
    cacheRef.current.invalidateSpotId(spotId);
  }, []);

  /** S3: sugerencias solo cuando agotamos find (stage global + 0 resultados). No en viewport/expanded. */
  const suggestions = useMemo(() => {
    if (mode !== 'spots') return [];
    const q = query.trim();
    if (q.length < THRESHOLD_CHARS || stage !== 'global' || results.length > 0) return [];
    return getSuggestions(q);
  }, [mode, query, stage, results.length]);

  /** Tap sugerencia: setQuery dispara búsqueda normal (viewport→expanded→global); reusa debounce/cache. */
  const onSuggestionTap = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
    },
    [setQuery]
  );

  const close = useCallback(() => setOpen(false), []);
  const open = useCallback(() => setOpen(true), []);

  return {
    query,
    setQuery,
    clear,
    results,
    sections,
    suggestions,
    onSuggestionTap,
    stage,
    cursor,
    hasMore,
    fetchMore,
    isLoading,
    isOpen,
    setOpen,
    open,
    close,
    onSelect,
    onCreate,
    setOnSelect,
    setOnCreate,
    invalidateSpotId,
  };
}
