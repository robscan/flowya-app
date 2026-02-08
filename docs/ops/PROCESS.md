# PROCESS — cómo se mantiene la memoria operativa

## Roles

- **Oscar (negocio / producto):** define prioridades, valida UX, decide trade-offs.
- **Arquitecto (ChatGPT):** diseña estrategia, contratos, criterios de cierre, QA mínimo.
- **Cursor (ejecución):** implementa en código + actualiza docs al cierre.

## Al inicio de una sesión (antes de code)

1) Leer `docs/ops/CURRENT_STATE.md` y `docs/ops/OPEN_LOOPS.md`.
2) Elegir **1 micro-scope** (máximo 1) y escribir:
   - objetivo
   - criterios de cierre
   - archivos afectados

## Al cierre de una sesión (obligatorio)

Cursor debe:
1) Actualizar `docs/ops/CURRENT_STATE.md` (solo lo de “Ahora mismo” + “Qué está abierto”).
2) Actualizar `docs/ops/OPEN_LOOPS.md`:
   - cerrar loops resueltos
   - abrir loops nuevos con criterio de cierre
3) Agregar bitácora nueva en `docs/bitacora/YYYY/MM/NNN-...md`
4) Si hubo PR (o se prepara):
   - crear/actualizar card en `docs/pr/YYYY/MM/`
   - agregarlo a `docs/pr/PR_INDEX.md`

## Regla anti-duplicación

- **OPEN_LOOPS** = lista única de pendientes.
- La bitácora NO es backlog, es evidencia.
- Las decisiones se registran una sola vez en `docs/ops/DECISIONS.md`.
