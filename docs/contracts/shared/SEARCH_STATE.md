# SEARCH_STATE

## Purpose
Definir el **estado canónico** del buscador como **capability shared** (usable por Explore / Flow / Remember) sin acoplarse a ninguna UI (overlay, sheet, etc.).

## Scope
- Gestión de query, resultados, paginación y “stage” (viewport/expanded/global).
- Soporte a “acciones” derivadas: **seleccionar resultado** y **crear spot desde no-results**.
- Política de cache e invalidación (incluye soft delete).

## Non-goals
- Render/UI (Radix/shadcn, sheets, modales, animaciones).
- Implementar providers concretos (Mapbox, Supabase). Eso vive en `SEARCH_EFFECTS`.
- Autocomplete completo (solo campo para introducirlo a futuro).

## Contract

### Tipos (pseudo-TypeScript)

```ts
type SearchContext =
  | { module: "explore"; viewport?: MapViewportSnapshot }
  | { module: "flow"; routeId?: string; viewport?: MapViewportSnapshot }
  | { module: "remember"; timeRange?: { fromISO: string; toISO: string } }
  | { module: "unknown" };

type SearchStage = "idle" | "viewport" | "expanded" | "global";

type SearchStatus = "closed" | "open";

type SearchLoadState =
  | { kind: "idle" }
  | { kind: "loading"; startedAtMs: number }
  | { kind: "error"; message: string; code?: string; atMs: number };

type SearchCursor =
  | { kind: "none" }
  | { kind: "offset"; value: number }
  | { kind: "opaque"; value: string };

type SearchResultKind = "spot" | "place" | "query-suggestion";

type SearchResultBase = {
  id: string;              // stable id (spotId for spot)
  kind: SearchResultKind;
  title: string;
  subtitle?: string;
  score?: number;          // provider-dependent
  source?: string;         // e.g. "supabase", "mapbox"
};

type SpotResult = SearchResultBase & {
  kind: "spot";
  spotId: string;
  coords: { lat: number; lng: number };
  isHidden?: boolean;      // should be false in normal operation
  saved?: boolean;
  visited?: boolean;
};

type PlaceResult = SearchResultBase & {
  kind: "place";
  placeId: string;
  coords: { lat: number; lng: number };
};

type QuerySuggestionResult = SearchResultBase & {
  kind: "query-suggestion";
  query: string;
};

type SearchResult = SpotResult | PlaceResult | QuerySuggestionResult;

type SearchSection =
  | { id: "spots"; title?: string; items: SpotResult[] }
  | { id: "places"; title?: string; items: PlaceResult[] }
  | { id: "suggestions"; title?: string; items: QuerySuggestionResult[] };

type CachePolicy = {
  enabled: boolean;
  ttlMs: number;           // e.g. 60000
  maxEntries: number;      // e.g. 100
};

type SoftDeleteInvalidation = {
  // spotIds que deben purgarse inmediatamente de cache/results
  hiddenSpotIds: Set<string>;
  // last updated; useful for debugging
  updatedAtMs: number;
};

type SearchState = {
  status: SearchStatus;    // "open"|"closed"
  context: SearchContext;

  query: string;
  stage: SearchStage;

  results: SearchResult[];     // raw flat list
  sections: SearchSection[];   // derived, for UI convenience

  cursor: SearchCursor;
  hasMore: boolean;

  load: SearchLoadState;

  // Behavior
  cachePolicy: CachePolicy;
  softDeleteInvalidation: SoftDeleteInvalidation;

  // Optional: last selection for UX (recent)
  lastSelected?: { kind: SearchResultKind; id: string; atMs: number };
};
```

### Notas
- `context` permite reutilización entre módulos sin cambiar contrato.
- `sections` es derivado; **no** es fuente de verdad (puede recalcularse desde `results`).
- `softDeleteInvalidation` existe para evitar “pins fantasmas” y resultados stale.

## Invariants (dev-only)
1. **Closed == inert:** si `status === "closed"`, entonces `load.kind !== "loading"` (no requests activas).
2. **Stage determinístico:** `stage !== "idle"` solo si `query.trim().length > 0` o el módulo lo fuerza.
3. **No hidden spots:** ningún `SpotResult` en `results/sections` puede tener `isHidden === true`.
4. **Cursor coherente:** si `hasMore === false`, entonces `cursor.kind === "none"` o cursor estable sin fetchMore.
5. **Sections subset:** todos los items de `sections` deben existir en `results` (por id/kind).
6. **Cache respects invalidation:** si `softDeleteInvalidation.hiddenSpotIds` contiene `spotId`, ese spot **no** puede estar en `results`.
7. **Selection safety:** `lastSelected` siempre se refiere a un id existente en `results` (o fue limpiado al cerrar).

## Source Mapping (today → future)
- Hoy:
  - Estado y control: `hooks/search/useSearchControllerV2.ts`
  - Estrategia/ranking: `lib/search/spotsStrategy.ts`
  - Normalización/sugerencias: `lib/search/normalize.ts`, `lib/search/suggestions.ts`
- Futuro:
  - `core/shared/search/state.ts` implementa `SearchState`
  - `core/shared/search/controller.ts` produce el estado y expone intents (ver `SEARCH_INTENTS`)

## Open Questions
- Si se usará autocomplete real (combobox) o solo query simple en V1.
