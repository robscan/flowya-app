# SEARCH_EFFECTS

## Purpose
Definir los **effects/adapters** que Search necesita para funcionar (fetch, cache, geocoding) sin acoplarse a plataforma.

## Scope
- Provider de búsqueda (strategy runner)
- Cache (get/set/clear + invalidación por soft delete)
- (Opcional) geocoding para creación desde query con contexto

## Non-goals
- Implementación concreta (Mapbox/Supabase) en contratos.
- UI (Radix, scroll-lock, focus).

## Contract

### Adapters (pseudo-TypeScript)

```ts
type SearchProvider = {
  runSearch(args: {
    query: string;
    stage: SearchStage;
    context: SearchContext;
    cursor: SearchCursor;
    limit: number;
    // optional: viewport hint
    viewport?: MapViewportSnapshot;
  }): Promise<{
    results: SearchResult[];
    cursor: SearchCursor;
    hasMore: boolean;
    stage: SearchStage; // provider may adjust stage
  }>;
};

type SearchCache = {
  get(key: string): SearchResult[] | null;
  set(key: string, value: SearchResult[]): void;
  clear(prefix?: string): void;
  invalidateSpotId(spotId: string): void; // critical for soft delete
};

type GeocodingProvider = {
  // used when query>=3 and we want a better seed for create
  resolvePlaceForCreate(args: { query: string; viewport?: MapViewportSnapshot }): Promise<{
    placeId: string;
    coords: { lat: number; lng: number };
    title?: string;
  } | null>;
};
```

### Notas
- `SearchProvider` puede implementar la lógica actual de `spotsStrategy` (viewport→expanded→global).
- Cache debe soportar invalidación por spotId para evitar resultados stale.

## Invariants (dev-only)
1. `invalidateSpotId(spotId)` debe garantizar que ningún `SpotResult` con ese id vuelva a aparecer desde cache.
2. `runSearch` nunca debe devolver `SpotResult.isHidden === true` (filtrar antes o post-proceso).
3. Si `runSearch` ajusta `stage`, debe ser consistente con `context` (ej. no “viewport” si no hay viewport).

## Effects / Adapters
- **SearchProvider**: implementado hoy por `lib/search/spotsStrategy.ts`.
- **SearchCache**: hoy vive dentro de `useSearchControllerV2` (TTL 60s).
- **GeocodingProvider**: hoy `lib/mapbox-geocoding.ts` (`resolvePlaceForCreate`), no usado en VNext.

## Source Mapping (today → future)
- Hoy:
  - Strategy: `lib/search/spotsStrategy.ts`
  - Cache: `hooks/search/useSearchControllerV2.ts`
  - Geocoding: `lib/mapbox-geocoding.ts`
- Futuro:
  - `core/shared/search/providers/spotsStrategyProvider.ts`
  - `core/shared/search/cache/memoryCache.ts` (o similar)
  - `core/shared/search/providers/geocodingProvider.ts`

## Open Questions
- Política exacta de invalidación: ¿purga global o por key + spotId? (Recomendado: por spotId).
