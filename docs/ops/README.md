# OPS — Estructura

Este directorio se reorganizó para mantener la raíz limpia.

## Documentos principales (siempre primero)

- `OPEN_LOOPS.md` (fuente diaria de ejecución)
- `docs/bitacora/*` (últimas entradas del día)
- `CURRENT_STATE.md` (snapshot de contexto, no bloqueante)

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
3. Usar `CURRENT_STATE.md` solo como contexto de alto nivel
4. Ejecutar trabajo usando planes/contratos de subcarpetas
