# 197 — F1-002 matriz de estados interactivos v1

Fecha: 2026-02-27  
Tipo: contratos / diseño de interacción

## Objetivo
Iniciar ejecución de `OL-WOW-F1-002` con un entregable concreto y verificable: matriz canónica de estados interactivos cross-platform.

## Cambios
- `docs/contracts/DESIGN_SYSTEM_USAGE.md`
  - Se agrega sección **Matriz canónica v1 (F1-002)**.
  - Se define alcance inicial en componentes críticos:
    - `IconButton`
    - `ActionButton` (Primary/Secondary)
    - `SearchListCard`
  - Se fija lista de estados obligatorios:
    - `default/hover/pressed/focus-visible/selected/disabled/loading`
  - Se documenta mapeo visual por estado y checklist mínimo de cierre.

- `docs/ops/OPEN_LOOPS.md`
  - `OL-WOW-F1-002` pasa de `ACTIVO` a `EN CURSO`.
  - Se agrega referencia explícita al avance de la matriz v1.

## Resultado
- F1-002 deja de estar en definición abstracta y queda en ejecución con criterios observables.
- Se prepara base para QA visual web/mobile una vez cierre F1-001.
