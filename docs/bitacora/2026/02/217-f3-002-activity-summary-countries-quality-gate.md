# 217 — F3-002 Activity Summary: quality gate de países

Fecha: 2026-02-28  
Tipo: avance técnico / OL-WOW-F3-002

## Contexto

Se implementa el gate técnico de calidad para `visitedCountriesCount` con criterio explícito de cobertura y prioridad de fuente, sin activar nuevas interacciones.

## Implementación

- Nuevo módulo runtime:
  - `core/explore/runtime/activitySummary.ts`
  - Evalúa países visitados con salida:
    - `count`
    - `coverage`
    - `quality` (`high|medium|low`)
    - fuentes usadas.
- Política aplicada:
  - `minCoverageToShow = 0.40`
  - `highCoverageThreshold = 0.80`
  - si calidad `low` -> `count = null` (UI muestra `—`).
- Prioridad de fuentes documentada y codificada:
  1) `spot.countryCode`
  2) `spot.linkedCountryCode`
  3) `spot.linkedCountryName`
  4) heurística desde `address`.

- Integración runtime en `MapScreenVNext` para resumen por filtro y Activity Summary.

## Documentación asociada

- Contrato actualizado: `docs/contracts/ACTIVITY_SUMMARY.md`.
- Checklist QA de cierre F3-002:
  - `docs/ops/plans/CHECKLIST_QA_F3_002_ACTIVITY_SUMMARY_COUNTRIES.md`.

## Estado

- F3-002 permanece **ACTIVO** hasta completar checklist QA manual con evidencia.
