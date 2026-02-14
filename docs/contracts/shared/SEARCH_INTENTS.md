# SEARCH_INTENTS

## Purpose
Definir las **intenciones** (API) con las que cualquier UI (web Radix/shadcn o nativa) interactúa con Search sin acoplarse a implementación.

## Scope
- Apertura/cierre
- Cambios de query
- Ejecución de búsqueda y paginación
- Selección de resultados
- Creación desde “no results” (handoff a Explore/Create Spot)

## Non-goals
- Side-effects reales (fetch, cache, geocoding) — ver `SEARCH_EFFECTS`.
- Reglas de UI (focus, scroll-lock, sheet snapping).

## Contract

### Tipos (pseudo-TypeScript)

```ts
type SearchIntent =
  | { type: "SEARCH/SET_CONTEXT"; context: SearchContext }
  | { type: "SEARCH/OPEN" }
  | { type: "SEARCH/CLOSE" }
  | { type: "SEARCH/SET_QUERY"; query: string; reason?: "typing"|"paste"|"suggestion" }
  | { type: "SEARCH/CLEAR_QUERY" }
  | { type: "SEARCH/SUBMIT"; query?: string } // optional: uses current query
  | { type: "SEARCH/FETCH_MORE" }
  | { type: "SEARCH/SELECT_RESULT"; result: SearchResult }
  | { type: "SEARCH/CREATE_FROM_NO_RESULTS"; seed: CreateFromNoResultsSeed }
  | { type: "SEARCH/INVALIDATE_SOFT_DELETED"; hiddenSpotId: string; atMs?: number };

type CreateFromNoResultsSeed =
  | { kind: "coords"; coords: { lat: number; lng: number }; query?: string }
  | { kind: "place"; placeId: string; coords: { lat: number; lng: number }; query?: string };
```

### Salidas esperadas
- Las intents producen cambios en `SearchState` y/o emiten “effects” (ver `SEARCH_EFFECTS`).

## Invariants (dev-only)
1. `SEARCH/SET_QUERY` con `query.trim()===""` debe resultar en `stage:"idle"` y `results:[]` (o un estado explícito).
2. `SEARCH/FETCH_MORE` solo es válido si `hasMore === true` y `load.kind !== "loading"`.
3. `SEARCH/SELECT_RESULT` no debe ejecutarse si `status === "closed"`.

## Events / Intents
Lista canónica (nombres estables):
- `SEARCH/SET_CONTEXT`
- `SEARCH/OPEN`
- `SEARCH/CLOSE`
- `SEARCH/SET_QUERY`
- `SEARCH/CLEAR_QUERY`
- `SEARCH/SUBMIT`
- `SEARCH/FETCH_MORE`
- `SEARCH/SELECT_RESULT`
- `SEARCH/CREATE_FROM_NO_RESULTS`
- `SEARCH/INVALIDATE_SOFT_DELETED`

## Source Mapping (today → future)
- Hoy:
  - `useSearchControllerV2.setOpen`, `setQuery`, `clear`, `fetchMore`
  - Callbacks por ref: `setOnSelect`, `setOnCreate` (acoplamiento actual)
- Futuro:
  - Controller expone `dispatch(intent)` o métodos directos equivalentes (pero semántica idéntica).

## Open Questions
- ¿Mantener API estilo `dispatch` o métodos? (No bloquea: define intents y se adapta).
