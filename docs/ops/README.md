# OPS — Estructura

Este directorio se reorganizó para mantener la raíz limpia.

## Documentos principales (siempre primero)

- `OPEN_LOOPS.md` (fuente diaria de ejecución + riesgos macro + cola de loops)
- `docs/bitacora/*` (evidencia de cierres y cambios)

No existe snapshot paralelo `CURRENT_STATE.md` (retirado 2026-03-21; bitácora `309`). El estado se deduce de los dos anteriores.

## Carpetas

- `plans/` — planes de ejecución (`PLAN_*.md`)
- `analysis/` — diagnósticos y análisis operativos
- `governance/` — decisiones, guardrails y procesos de trabajo
- `strategy/` — mapa del sistema y contratos/lineamientos de estrategia UX
- `templates/` — prompts/plantillas de operación
- `docs/_archive/ops/` — planes/cierres históricos y documentos deprecated

## Regla rápida

1. Revisar `OPEN_LOOPS.md`
2. Revisar bitácora reciente (últimas entradas del día activo)
3. Ejecutar trabajo usando planes/contratos de subcarpetas
