# 219 — F3-003 observabilidad mínima: implementación base

Fecha: 2026-02-28  
Tipo: avance técnico / OL-WOW-F3-003

## Contexto

Se implementa la base de observabilidad mínima para decisiones UX en Explore, manteniendo scope acotado y sin cambios de comportamiento funcional.

## Implementación

- Nuevo módulo: `lib/explore/decision-metrics.ts`
  - `recordExploreDecisionStarted`
  - `recordExploreDecisionCompleted`
  - `recordExploreSelectionChanged`
  - snapshot en `globalThis.__flowyaExploreDecisionMetrics`.

- Integración en `MapScreenVNext`:
  - inicio de decisión (search/map),
  - cambios de selección (spot/poi selected/cleared),
  - cierre de decisión (saved/visited/dismissed/opened_detail).

## Guardrails

- Sin tracking remoto ni envío de red.
- Sin cambios de UX ni de APIs públicas.
- Instrumentación mínima y local para validar costo y payloads.

## Estado

- F3-003 permanece **ACTIVO** hasta ejecutar checklist QA y validar overhead.
