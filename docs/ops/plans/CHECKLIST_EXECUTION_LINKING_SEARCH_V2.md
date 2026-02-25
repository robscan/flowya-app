# Checklist Operativo — Spot Linking + Search V2 POI-first

**Fecha:** 2026-02-25  
**Estado:** Activo  
**Rama base sugerida para ejecución:** `main`

---

## 0) Secuencia de ejecución (obligatoria)
1. Cerrar `PLAN_SPOT_LINKING_VISIBILITY_SAFE_ROLLOUT` (Fase C-D pendiente).
2. Ejecutar `PLAN_SEARCH_V2_POI_FIRST_SAFE_MIGRATION` (Fase A-E).
3. Hacer hardening transversal (deep link, address post-create, system status bar).

---

## 1) Track A — Spot Linking Visibility Safe Rollout

### A1. Estado actual (ya ejecutado)
- [x] `spots.link_*` en DB (migración aplicada).
- [x] Resolver `resolveSpotLink` activo para Edit Spot (detrás de flag).
- [x] Create from POI/Search persiste `link_*` en insert.
- [x] Tap POI prioriza `linked_place_id` y fallback seguro para `linked`.

### A2. Fase C (render e iconografía) — completada en main
- [x] Activar `ff_hide_linked_unsaved` en entorno de prueba.
- [x] Implementar/validar regla visual:
  - `linked && !saved && !visited` => ocultar pin FLOWYA.
  - `uncertain || unlinked` => mantener pin FLOWYA.
- [x] Activar `ff_flowya_pin_maki_icon` con fallback de icono desconocido.
- [x] Guardrail de visibilidad: no ocultar `linked+unsaved` si falta `linked_place_id`.

**Archivos foco**
- `components/explorar/MapScreenVNext.tsx`
- `components/design-system/map-pins.tsx`
- `lib/map-core/spots-layer.ts`
- `lib/feature-flags.ts`

### A3. Pendiente Fase D (hardening)
- [x] Definir umbrales operativos finales usando métricas del resolver.
- [ ] Ejecutar QA no-go:
  - zonas densas (nombres repetidos),
  - zonas sin POI,
  - zoom alto/medio/bajo,
  - tema light/dark.
- [ ] Confirmar que no hay desaparición de lugar (POI base o pin FLOWYA).

**Criterios de bloqueo (no-go)**
- `uncertain > 15%` en muestra QA.
- Casos reproducibles de desaparición visual del lugar.
- Regresión tap->sheet en spots linked.

### A4. Documentación obligatoria al cerrar
- [x] `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`
- [x] `docs/contracts/MAP_PINS_CONTRACT.md`
- [x] `docs/contracts/DATA_MODEL_CURRENT.md`
- [x] `docs/ops/OPEN_LOOPS.md`
- [x] `docs/bitacora/2026/02/133-phase-d-hardening-guardrails-y-qa-matrix.md`

---

## 2) Track B — Search V2 POI-first Safe Migration

### B1. Fase A (contrato y banderas)
- [x] Añadir flags:
  - `ff_search_external_poi_results`
  - `ff_search_mixed_ranking`
  - `ff_search_external_dedupe`
- [x] Actualizar contrato Search V2.1 mixto.

**Archivos foco**
- `lib/feature-flags.ts`
- `docs/contracts/SEARCH_V2.md`
- `docs/definitions/search/SEARCH_V2.md`

### B2. Fase B (adapter externo)
- [x] Crear `searchPlacesPOI` (adapter externo con fallback Geocoding seguro).
- [x] Mapear resultado común `PlaceResultV2` (`id`, `maki`, `featureType`, categorías).
- [x] Integrar adapter en no-results de Explore detrás de `ff_search_external_poi_results`.

**Archivos foco**
- `lib/places/searchPlacesPOI.ts` (nuevo)
- `lib/places/searchPlaces.ts` (compatibilidad/fallback)
- `hooks/search/useSearchControllerV2.ts` (integración)

### B3. Fase C (ranking mixto por secciones)
- [x] Implementar secciones:
  - Spots internos (primero),
  - POI/Landmark externos,
  - Place/address fallback.
- [x] Aplicar ranking taxonómico de intents.
- [x] Dedupe interno/externo por `linked_place_id` o proximidad+nombre.

**Archivos foco**
- `hooks/search/useSearchControllerV2.ts`
- `components/search/*`
- `lib/search/*` (ranker/strategies)

### B4. Fase D (integración create/linking)
- [x] Confirmar persistencia de snapshot mínimo externo en create-from-search.
- [x] Alinear con linking existente (sin duplicar lógica).

**Archivos foco**
- `components/explorar/MapScreenVNext.tsx`
- `lib/spot-linking/*`
- `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`

### B5. Fase E (rollout y hardening)
- [x] Rollout progresivo por flags.
- [x] Métricas mínimas:
  - CTR resultado útil (spot/poi),
  - tasa no-results,
  - create exitoso desde search,
  - regresiones de performance.
- [ ] Validar no-go de Search.

**Estrategia de rollout (operativa)**
- Etapa 0 (OFF): `ff_search_external_poi_results=false`, `ff_search_mixed_ranking=false`, `ff_search_external_dedupe=false`.
- Etapa 1 (adapter): activar `ff_search_external_poi_results=true`.
- Etapa 2 (calidad): activar `ff_search_external_dedupe=true`.
- Etapa 3 (ranking): activar `ff_search_mixed_ranking=true`.
- No avanzar de etapa si falla no-go de Search.

**Métricas runtime (QA/manual)**
- Expuestas en `globalThis.__flowyaSearchMetrics`.
- Señales clave:
  - `ctrUseful` (clicks útiles / búsquedas iniciadas),
  - `noResultsRate`,
  - `createFromSearchSuccessRate`,
  - `externalFetchAvgDurationMs`, `externalFetchErrors`.
- Guardrail de intents:
  - verificar precedencia `landmark > geo > recommendation` con casos:
    - `Torre Eiffel` (debe priorizar landmark),
    - `París, Francia` (debe priorizar geo),
    - query comercial (debe quedar en recommendation).

---

## 3) Sanidad por iteración (check fijo)
- [x] `npm run lint`
- [x] `npm run build`
- [ ] Smoke manual:
  - crear spot desde POI,
  - editar ubicación y re-link,
  - tap en POI linked/unlinked,
  - búsqueda no-results con chooser,
  - deep link `spotId + sheet`.

---

## 4) Cierre de ejecución
- [ ] PR(s) con alcance acotado por fase.
- [ ] Merge a `main` solo con sanidad verde.
- [ ] Actualizar `OPEN_LOOPS` moviendo items cerrados a bitácora.
