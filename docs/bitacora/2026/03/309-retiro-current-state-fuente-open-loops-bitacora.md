# 309 — Retiro de `CURRENT_STATE.md`; fuente única OPEN_LOOPS + bitácora

Fecha: 2026-03-21  
Tipo: Ops / gobernanza documental

## Decisión

Se elimina `docs/ops/CURRENT_STATE.md` (archivo retirado del repo). El **estado operativo** se deduce exclusivamente de:

- [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md) (alcance, loops, riesgos macro, arranque)
- [`docs/bitacora/`](..) (evidencia de cierres y cambios)

Motivo: evitar inconsistencias por mantener dos snapshots paralelos.

## Contenido migrado

Los bloques útiles del último snapshot (riesgos macro, recordatorio migraciones Supabase `018_*`, gates históricos) quedan consolidados en `OPEN_LOOPS.md` en la misma fecha.
