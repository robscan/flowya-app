# 276 — Planificación de `OL-EXPLORE-SEARCH-BATCH-001`

Fecha: 2026-03-03  
Tipo: Planificación operativa  
Área: `docs/ops`

## Decisión

Se incorpora el loop `OL-EXPLORE-SEARCH-BATCH-001` para habilitar marcado masivo de spots (`Por visitar` / `Visitados`) desde búsqueda filtrada (`saved/visited`), con enfoque de no-regresión en runtime map-first.

## Orden acordado

1. Cerrar primero `OL-CONTENT-001`.
2. Ejecutar `OL-EXPLORE-SEARCH-BATCH-001`.
3. Continuar con `OL-CONTENT-002` y resto de cola secuencial.

## Evidencia documental

- `docs/ops/OPEN_LOOPS.md` actualizado con el OL en cola secuencial y prioridad post `OL-CONTENT-001`.
- Plan técnico dedicado:
  - `docs/ops/plans/PLAN_OL_EXPLORE_SEARCH_BATCH_001_2026-03-03.md`.
