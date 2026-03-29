# 316 — Follow-up Explore: ghost refetch y sync documental de contratos

Fecha: 2026-03-29
Tipo: Fix runtime + documentación

## Contexto
Quedaban tres PRs abiertos de Cursor. Dos puntos seguían vigentes:

- un bug de Explore donde un merge rápido al volver desde edición/delete podía dejar un lugar fantasma en estado local
- contratos de Explore con información útil ya verificada en runtime, pero no reflejada todavía en docs

## Cambios aplicados
- **Ghost cleanup en Explore:** `mergeSpotFromDbById` ahora devuelve estado (`merged | missing | skipped`).
- **Focus refresh seguro:** si el merge rápido devuelve `missing`, Explore ejecuta `refetchSpots()` completo para reconciliar estado local y eliminar fantasmas tras ediciones/delete rápidos.
- **Sync documental absorbido localmente:**
  - `docs/contracts/DEEP_LINK_SPOT.md`
  - `docs/contracts/explore/FILTER_RUNTIME_RULES.md`
  - `docs/contracts/explore/MAP_RUNTIME_RULES.md`
- Se añadieron restricciones verificadas, troubleshooting y notas de persistencia/refetch ya alineadas con runtime actual.

## Evidencia
- `components/explorar/MapScreenVNext.tsx`
- `docs/contracts/DEEP_LINK_SPOT.md`
- `docs/contracts/explore/FILTER_RUNTIME_RULES.md`
- `docs/contracts/explore/MAP_RUNTIME_RULES.md`

## Validación
- `npx tsc --noEmit`

## Decisión operativa
- PR `#116`: cerrable si las migraciones `018_*` ya fueron aplicadas y verificadas en el entorno objetivo.
- PR `#114`: absorbido parcialmente en local; ya no hace falta conservarlo como fuente separada.
