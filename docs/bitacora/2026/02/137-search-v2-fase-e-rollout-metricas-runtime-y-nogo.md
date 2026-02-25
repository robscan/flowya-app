# Bitácora 137 — Search V2 Fase E parcial (rollout + métricas runtime + no-go)

**Fecha:** 2026-02-25  
**Rama:** `main`

---

## Objetivo

Completar hardening operativo de Track B para Search V2:

- definir rollout progresivo por flags,
- instrumentar métricas mínimas para evaluar no-go sin backend nuevo,
- dejar trazabilidad de estado en checklist/contratos/open loops.

## Cambios aplicados

Archivos:

- `lib/search/metrics.ts` (nuevo)
- `components/explorar/MapScreenVNext.tsx`
- `docs/ops/plans/CHECKLIST_EXECUTION_LINKING_SEARCH_V2.md`
- `docs/contracts/SEARCH_V2.md`
- `docs/definitions/search/SEARCH_V2.md`
- `docs/ops/OPEN_LOOPS.md`

### 1) Métricas runtime Search

Se agregó `lib/search/metrics.ts` con estado acumulado expuesto en:

- `globalThis.__flowyaSearchMetrics`

Métricas incluidas:

- `searchesStarted`
- `searchNoResults`
- `spotClicks`
- `externalClicks`
- `createFromSearchSuccess`
- `createFromSearchError`
- `externalFetchAvgDurationMs`
- `externalFetchErrors`

Derivadas:

- `ctrUseful`
- `noResultsRate`
- `createFromSearchSuccessRate`

### 2) Puntos de instrumentación en Explore/Search

En `MapScreenVNext`:

- se registra búsqueda iniciada (`query >= 3`, search abierto),
- se registra evento de no-results (sin duplicar por misma query),
- se registra click útil interno (spot) y externo (sugerencia place/poi),
- se registra latencia/error del fetch externo de sugerencias,
- se registra éxito/error de create-from-search cuando la creación nace desde sugerencia externa.

### 3) Guardrails de linking en create-from-search

Se mantiene el guardrail introducido en fase previa:

- IDs sintéticos de fallback (`place-*`) no se persisten como `linked_place_id`.

## Rollout por etapas (documentado)

- Etapa 0: todo OFF.
- Etapa 1: `ff_search_external_poi_results=true`.
- Etapa 2: `ff_search_external_dedupe=true`.
- Etapa 3: `ff_search_mixed_ranking=true`.

Regla: no avanzar de etapa si falla no-go de Search.

## Pendiente

- Ejecución manual final de matriz no-go de Search (QA en escenarios reales), usando `__flowyaSearchMetrics` como evidencia cuantitativa.
