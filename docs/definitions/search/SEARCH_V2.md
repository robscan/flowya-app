# Search V2 — Source of truth

**Estado:** En implementación (S1–S5). Feature flag: `SEARCH_V2_ENABLED` en `constants/flags.ts`. Rollback: poner flag en `false`.

---

## Principios

- **Promesa:** Primero ENCONTRAR (rápido y completo). Si no existe, CREAR (sugerencias + CTA "Crear").
- **Mode separation:** `mode="spots"` solo Spots/DB (viewport/etapas); `mode="places"` solo Mapbox forward/places.
- **UI canónica** separada del motor/strategy; controller con debounce único, cancelación/guard, cache TTL.

---

## Arquitectura

- **SearchInputV2:** Input + clear "X" integrado (sin fondo blanco). Threshold 3 chars aplicado en controller.
- **SearchResultsListV2:** Listado por secciones; `onEndReached` → `fetchMore`; sin paginación visible.
- **useSearchControllerV2:** Expone `query`, `setQuery`, `clear`, `results`, `sections`, `suggestions`, `onSuggestionTap`, `stage`, `cursor`, `hasMore`, `fetchMore`, `isLoading`, `isOpen`, `setOpen`, `onSelect`, `onCreate`. Cache in-memory TTL (30–120s). Strategy: `search({ query, stage, bbox, filters, cursor })`. S3: `suggestions` solo cuando stage global + 0 resultados.

---

## Modos

| Modo     | Uso        | Motor              | Toggleable | Filtros |
|----------|------------|--------------------|-----------|---------|
| spots    | Mapa       | Spots/DB por bbox  | Sí        | Sí      |
| places   | Create Spot| Mapbox forward     | No        | No      |

---

## Contrato SpotsStrategy (S2) — obligatorio

**SpotsStrategy = viewport-first + progressive + limit + cursor**

- **Stage secuencial:** viewport → expanded → global. Una etapa por petición; si 0 resultados se avanza a la siguiente (cancelación/guard). No en paralelo.
- **Limit por batch:** 20–30 ítems por petición; batches siguientes +20. La strategy devuelve `items.length ≤ limit`, `nextCursor`, `hasMore`.
- **fetchMore por cursor:** Sin UI de paginación. Lista con infinite scroll; `onEndReached` → `fetchMore()`; `cursor` pasado a la strategy; bloquear si `isLoading` o `!hasMore`.
- **Mapa:** Cap de pins (300–500) o clustering. Si se excede: hint "Hay demasiados resultados, acerca el zoom para verlos".
- **Filtros:** Todos / Por visitar / Visitados **aplicados en la query** (Spots/DB o capa de datos). No post-filtro en cliente cuando crezca el dataset.

---

## Guardrails S2 (respetar al implementar)

- **Stage y fetchMore no se mezclan:** El stage solo avanza en el search() inicial (viewport → expanded → global). fetchMore() solo opera dentro del mismo stage (siguiente página, mismo stage/cursor); no dispara expanded ni global.
- **BBox estable:** Redondear bbox o grid por zoom para evitar ruido y cache misses.
- **Mapa cap/clustering desde el día 1:** Implementar cap/clustering aunque hoy haya pocos spots; evita diseño dependiente de poca data.

---

## Progressive Search (mode="spots")

Etapas secuenciales (no en paralelo), con cancelación/guard:

1. **viewport** — bbox del viewport.
2. Si 0 resultados → **expanded** — bbox ampliado (ej. 3× o radio por zoom).
3. Si 0 resultados → **global** — top N global acotado.

UI indica contexto: "En esta zona" / "Cerca de aquí" / "En todo el mapa".

---

## Infinite scroll y límites

- Lista: limit inicial 20–30, batches +20. `fetchMore()`, `hasMore`, `cursor`; bloquear si `isLoading` o `!hasMore`.
- Mapa: cap 300–500 pins o clustering; hint "Hay demasiados resultados, acerca el zoom para verlos".

---

## Cache y cancelación

- Cache key: `${mode}:${stage}:${filters}:${bbox}:${normalizedQuery}:${cursor?}`.
- TTL 30–120s. RequestId/AbortController para respuestas tardías.

---

## Sugerencias (S3) — solo después de agotar "find"

- **Condición obligatoria:** `mode === 'spots'` AND `query.trim().length >= 3` AND **stage === 'global'** AND **results.length === 0**.
- **No** mostrar sugerencias en viewport ni expanded (aunque haya 0 resultados).
- **No** mostrar sugerencias si ya hay resultados en cualquier stage.
- Tap sugerencia = una sola acción: `setQuery(suggestion)` → dispara búsqueda normal (viewport→expanded→global); reutiliza debounce/cancelación/caché; sin llamadas duplicadas.
- Diccionario ES↔EN mínimo curado (`lib/search/suggestions.ts`); `normalizeQuery`; máximo 3 sugerencias.
- UI: sección "Sugerencias" (lista tipo Google, filas tapables); CTA "Crear" se mantiene (no "Crear spot: …").

---

## Create Spot (mode="places")

- Always-open debajo del header "Selecciona ubicación del spot".
- No toggle, no filtros, no cierre por tap afuera.
- Selección → centra mapa + `selectedPlace`. CTA principal requiere selectedPlace (recomendado).

---

## Bitácoras

- 028-search-v2-s1.md — Foundation
- 029-search-v2-s2-map-integration.md — Map + progressive + infinite scroll
- 030-search-v2-s3-suggestions.md — Sugerencias
- 031-search-v2-s4-create-spot.md — Create Spot
- 032-search-v2-s5-cleanup.md — Cleanup
