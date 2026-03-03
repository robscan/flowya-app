# Plan: OL-SEARCHV2-001 — Empty recommendations con landmarks visibles + fallback seguro

Fecha: 2026-03-03  
Estado: Propuesto (ASAP)  
Prioridad: Alta (ajuste inmediato UX/JTBD)  

## Objetivo

Resolver el caso `Todos + query vacía` donde el usuario espera sugerencias interesantes (landmarks) y hoy recibe resultados pobres en ciertas ciudades (ej. Panamá), sin romper comportamientos existentes de SearchV2.

## Contexto y restricciones

- `SearchV2` es el motor canónico de búsqueda (`docs/contracts/SEARCH_V2.md`).
- No se abrirá lógica paralela permanente en `MapScreenVNext`.
- No se debe inflar la lista con spots irrelevantes; prioridad en landmarks interesantes.
- Guardrail: mantener comportamiento actual en `saved/visited` y en búsquedas con query (`>=3`).

## Alcance

### In scope

1. Extraer lógica de recomendaciones vacías a módulo de búsqueda:
   - `lib/search/emptyRecommendations.ts` (nuevo)
2. Pipeline de recomendaciones en dos etapas:
   - Etapa A (primaria): landmarks visibles del viewport (`queryRenderedFeatures`)
   - Etapa B (fallback): API externa si A no alcanza umbral mínimo
3. Integración explícita con SearchV2 (`mode=spots`, `pinFilter=all`, `query=""`).
4. Feature flag de rollout:
   - `EXPO_PUBLIC_FF_SEARCH_EMPTY_RECO_V2`
5. Telemetría mínima:
   - `empty_reco_stage_used` (`visible|fallback`)
   - `empty_reco_results_count`
   - `empty_reco_fallback_calls`

### Out of scope

1. Cambios de copy/UI final.
2. Rediseño global de ranking con query.
3. Migraciones DB para cache persistente (eso va en `OL-SEARCHV2-002`).

## Diseño técnico (ASAP)

## 1) Contrato nuevo (runtime)

Tipo objetivo:

- `EmptyRecommendationItem = Spot | PlaceResult`

Funciones:

1. `collectVisibleLandmarks(map, opts): PlaceResult[]`
2. `buildEmptyRecommendations({ spots, visibleLandmarks, fallbackPlaces }): (Spot|PlaceResult)[]`
3. `needsExternalFallback(visibleCount, minTarget): boolean`

Referencia de utilidades reusadas:

- `lib/explore/map-screen-orchestration.ts` (`dedupeExternalPlacesAgainstSpots`, `rankExternalPlacesByIntent`, `mergeSearchResults`).

## 2) Regla de ejecución

Aplicar solo si:

1. `searchIsOpen === true`
2. `query.trim().length === 0`
3. `pinFilter === "all"`

No aplica para:

1. `pinFilter === "saved" | "visited"`
2. query con texto

## 3) Algoritmo

1. Leer landmarks visibles del viewport.
2. Normalizar/dedupear por `placeId` estable o `name+coords`.
3. Si `visibleLandmarks.length >= MIN_EMPTY_RESULTS`:
   - usar solo visibles (más spots locales relevantes si aplica merge canónico).
4. Si `< MIN_EMPTY_RESULTS`:
   - disparar fallback externo controlado (categorías/POI) y fusionar.
5. Orden final:
   - spots con estado (`to_visit|visited`)
   - landmarks visibles
   - fallback externo restante

`MIN_EMPTY_RESULTS` recomendado inicial: `4`.

## 4) Integración

Archivos principales:

1. `components/explorar/MapScreenVNext.tsx`
2. `hooks/search/useSearchControllerV2.ts` (si se decide exponer estado auxiliar)
3. `lib/search/emptyRecommendations.ts` (nuevo)

## Riesgos y mitigación

1. Riesgo: divergencia con SearchV2 por lógica ad hoc en pantalla.
   - Mitigación: módulo reutilizable fuera de `MapScreen`, contrato explícito.
2. Riesgo: baja cobertura de landmarks visibles en zoom bajo.
   - Mitigación: fallback automático.
3. Riesgo: más consultas externas.
   - Mitigación: fallback solo bajo umbral, no en paralelo.
4. Riesgo: regresión en ciudades que hoy funcionan.
   - Mitigación: feature flag + QA focal por ciudades.

## Plan de ejecución ASAP

1. Crear `lib/search/emptyRecommendations.ts` con funciones puras + tests unitarios.
2. Integrar etapa de landmarks visibles en `MapScreenVNext`.
3. Aplicar fallback externo solo cuando el umbral no se cumple.
4. Instrumentar métricas y logs básicos de etapa usada.
5. QA manual en:
   - Panamá (zoom bajo/medio/alto)
   - París
   - Ciudad de baja densidad
6. Registrar bitácora y actualizar `OPEN_LOOPS`.

## Criterios de aceptación

1. Caso Panamá deja de mostrar solo 1 resultado cuando hay landmarks visibles en mapa.
2. Sin regresiones en `saved/visited`.
3. Sin regresiones en query escrita (`>=3`).
4. En sesiones repetidas de apertura/cierre search no se disparan consultas innecesarias por defecto.

## Referencias

- `docs/contracts/SEARCH_V2.md`
- `docs/contracts/shared/SEARCH_EFFECTS.md`
- `docs/ops/plans/PLAN_SEARCH_V2_POI_FIRST_SAFE_MIGRATION.md`
- `docs/ops/plans/PLAN_OL_WOW_F2_001_EMPTY_LISTA_UNIFICADA_ISEMPTY.md`
