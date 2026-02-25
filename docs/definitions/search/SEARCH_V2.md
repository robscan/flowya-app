# Search V2 — Source of truth

**Estado:** Search V2 es el **único** search del mapa (S5: legacy eliminado). Create Spot paso 1 siempre usa SearchInputV2 (mode="places"). Ya no hay feature flag; rollback = revert del PR de S5.

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

**Mapa (S5):** El mapa usa **solo** Search V2 (mode="spots"). Legacy eliminado; sin condicional ni flag. Overlay de búsqueda theme-aware. **Filtros** (Todos / Por visitar / Visitados) visibles dentro del panel Search. Sugerencias y resultados en panel tipo sheet.

### Regla UX de filtros en Search (2026-02-25)

- `Todos`: se permiten recomendaciones externas (Mapbox) y CTA `Crear spot aquí` en estado sin resultados.
- `Por visitar` / `Visitados`: búsqueda restringida al grupo del usuario.
  - No mostrar recomendaciones externas.
  - No mostrar CTA `Crear spot aquí`.
  - Mostrar mensaje guía centrado: cambiar a `Todos` para explorar resultados del mundo.
- Overlay web: tap en fondo no cierra Search (solo blur del input cuando aplica).

---

## Contrato SpotsStrategy (S2) — obligatorio

**SpotsStrategy = viewport-first + progressive + limit + cursor**

- **Stage secuencial:** viewport → expanded → global. Una etapa por petición; si 0 resultados se avanza a la siguiente (cancelación/guard). No en paralelo.
- **Limit por batch:** 20–30 ítems por petición; batches siguientes +20. La strategy devuelve `items.length ≤ limit`, `nextCursor`, `hasMore`.
- **fetchMore por cursor:** Sin UI de paginación. Lista con infinite scroll; `onEndReached` → `fetchMore()`; `cursor` pasado a la strategy; bloquear si `isLoading` o `!hasMore`.
- **Mapa:** Cap de pins (300–500) o clustering. Si se excede: hint "Hay demasiados resultados, acerca el zoom para verlos".
- **Filtros:** Todos / Por visitar / Visitados **aplicados en la query** (Spots/DB o capa de datos). No post-filtro en cliente cuando crezca el dataset.
- **Match texto (acentos):** Comparación accent-insensitive en cliente: `normalizeQuery(query)` vs `normalizeQuery(spot.title)` (lowercase + NFD sin diacríticos). **Futuro (escala):** migrar a búsqueda server-side con columna normalizada o `unaccent` + `ILIKE` con índice.

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

- **@deprecated 2026-02-22:** UI de sugerencias ES↔EN oculta; reemplazo previsto: `mapPoiResults` (POIs del mapa en resultados). Ver `GUARDRAILS_DEPRECACION`.
- **Condición obligatoria (cuando se usaba):** `mode === 'spots'` AND `query.trim().length >= 3` AND **stage === 'global'** AND **results.length === 0**.
- **No** mostrar sugerencias en viewport ni expanded (aunque haya 0 resultados).
- **No** mostrar sugerencias si ya hay resultados en cualquier stage.
- Tap sugerencia = una sola acción: `setQuery(suggestion)` → dispara búsqueda normal (viewport→expanded→global); reutiliza debounce/cancelación/caché; sin llamadas duplicadas.
- Diccionario ES↔EN mínimo curado (`lib/search/suggestions.ts`); `normalizeQuery`; máximo 3 sugerencias.
- UI: sección "Sugerencias" (lista tipo Google, filas tapables) dentro de panel con scroll; CTA con nombre (véase CTA Crear en mapa).
- **Crear desde sin resultados (mode=spots):** (1) Listado de lugares Mapbox (`searchPlaces`, limit 6–8) con nombre + dirección visible; tap = crear spot con esas coords. (2) CTA "Crear spot aquí" (UGC): centro del mapa o ubicación; sin resolver texto. **Prohibido** CTA único que resuelva texto sin mostrar ubicación al usuario.
- **Futuro:** Marcar términos genéricos (ej. centro↔Center) para no sugerirlos cuando la query sea de 1 sola palabra o muy corta; hoy no bloquea porque sugerencias solo aparecen tras global+0 resultados.

---

## Create Spot (mode="places") — S4

- **SearchInputV2** always-open debajo del header "Selecciona ubicación del spot". Sin toggle, sin filtros, sin cierre por tap afuera.
- Motor: Mapbox forward geocoding (múltiples resultados, limit 10–15) vía `lib/places/searchPlaces.ts` y `createPlacesStrategy`.
- **PlaceResult:** `{ id, name, fullName?, lat, lng, source: 'mapbox' }`.
- Selección de resultado → centra mapa (`MapLocationPicker` prop `externalCenter`) + setea **selectedPlace**.
- CTA "Confirmar ubicación" del paso 1 requiere pin (manual o desde búsqueda); con selectedPlace se pasa `externalCenter` y el pin se coloca ahí.
- **Params desde search:** `/create-spot?name=...&lat=...&lng=...&source=search` → se inicializa **selectedPlace** con esos datos y el mapa centra (initialLatitude/initialLongitude); SearchInputV2 sigue visible always-open. No ocultar el buscador.
- **Clear X:** limpia query y resultados; **selectedPlace se mantiene** (el pin no se quita; el usuario puede buscar otro lugar o confirmar el actual). Documentado en bitácora 031.
- Create Spot paso 1 con búsqueda de lugares es siempre V2 (sin flag).

---

## Bitácoras

- 028-search-v2-s1.md — Foundation
- 029-search-v2-s2-map-integration.md — Map + progressive + infinite scroll
- 030-search-v2-s3-suggestions.md — Sugerencias
- 031-search-v2-s4-create-spot.md — Create Spot
- 032-search-v2-s5-cleanup.md — Cleanup
- 134-search-v2-track-b-fase-a-b-flags-adapter-poi.md — Track B Fase A-B
- 135-search-v2-fase-c-secciones-mixtas-y-dedupe.md — Track B Fase C parcial
- 136-search-v2-fase-c-ranking-intents-y-fase-d-alineacion-create-linking.md — Track B Fase C + D parcial
- 137-search-v2-fase-e-rollout-metricas-runtime-y-nogo.md — Track B Fase E parcial
- 138-search-v2-intents-precedence-landmark-geo-y-sync-docs.md — Track B hardening intents
- 141-search-v2-simplificacion-forward-single-request-y-guardrail-429.md — Track B resiliencia + simplificación

---

## Track B (POI-first safe migration) — estado operativo

Fase A-B (actual):

- Flags disponibles:
  - `EXPO_PUBLIC_FF_SEARCH_EXTERNAL_POI_RESULTS`
  - `EXPO_PUBLIC_FF_SEARCH_MIXED_RANKING`
  - `EXPO_PUBLIC_FF_SEARCH_EXTERNAL_DEDUPE`
- Adapter externo: `lib/places/searchPlacesPOI.ts`
  - contrato común `PlaceResultV2` (`id`, `maki`, `featureType`, `categories`, coords)
  - Search Box `/forward` (single request) como fuente principal
  - fallback estable a `searchPlaces` (Geocoding v6)
  - guardrail anti-rate-limit: cooldown temporal cuando Search Box devuelve `429`
- Integración actual:
  - Search no-results en Explore usa adapter externo detrás de flag (`EXPO_PUBLIC_FF_SEARCH_EXTERNAL_POI_RESULTS`)
  - dedupe opcional detrás de `EXPO_PUBLIC_FF_SEARCH_EXTERNAL_DEDUPE`

Implementado en Fase C:

- sección mixta en Search Overlay: spots internos + POI/direcciones externas.
- dedupe interno/externo por `linked_place_id` y fallback de proximidad+nombre.
- ranking taxonómico de intents en sugerencias externas (`poi_landmark > poi > place > address`).

Implementado en Fase D parcial:

- create-from-search mantiene snapshot mínimo externo vía create-from-POI (`name`, `lat/lng`, `linked_place_id`, `linked_place_kind`, `linked_maki`).
- guardrail: IDs sintéticos de fallback no se persisten como `linked_place_id` para evitar enlaces falsos.

Implementado en Fase E parcial:

- métricas runtime mínimas para QA/no-go en `globalThis.__flowyaSearchMetrics`:
  - CTR útil (`spotClicks + externalClicks` / `searchesStarted`),
  - tasa de no-results (`searchNoResults / searchesStarted`),
  - éxito create-from-search (`createFromSearchSuccessRate`),
  - latencia/error de fetch externo (`externalFetchAvgDurationMs`, `externalFetchErrors`).

Intents operativas (orden de precedencia actual):

- `landmark`: monumentos/atracciones (ej. "Torre Eiffel", "Museo del Louvre").
- `geo`: lugar geográfico/topónimo (ej. "París, Francia", "Cozumel").
- `recommendation`: resto de queries (flujo de recomendaciones).

Regla crítica:

- `landmark` siempre prevalece sobre `geo` para evitar desvíos a topónimos genéricos (ej. "Torre" en otros países).
- En `landmark`, ranking reforzado por:
  - match exacto de nombre de consulta,
  - cobertura completa de tokens del query,
  - normalización de variantes/typos frecuentes (ej. `Eifel` -> `Eiffel`) para ranking,
  - penalización de términos comerciales/ruido (ej. "fiestas", "convenciones", "replica"),
  - penalización de resultados tipo `address/street`.
- Guardrail canónico de landmark:
  - boost explícito a candidato landmark canónico cuando coincide nombre + ciudad esperada (ej. `Torre Eiffel` + `Paris`).
- En `landmark`, búsqueda externa opera en modo global (sin `bbox/proximity`) para evitar sesgo por ubicación actual del usuario.
