# Bitácora 073 (2026/02) — OL-050e: Sheet gestures unified + guardrails drag areas (Spot + Search)

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** Dejar documentado en contratos las reglas unificadas de gestures y drag areas para SpotSheet y SearchSheet.

## Causa

- Tras OL-036, OL-048, OL-049 y fixes de capas, SpotSheet y SearchSheet tienen comportamientos estables pero no estaban explícitos en un solo lugar: quién tiene cuántos estados, dónde se permite drag, y qué pasa cuando Search está abierto.

## Decisiones

- **EXPLORE_SHEET.md:** Añadida subsección "1.1) Sheet gestures unified (implementación actual)":
  - SpotSheet = 3 estados + drag/snap.
  - SearchSheet = 2 estados (closed / open_full) + drag-to-dismiss.
  - Drag solo en handle/header; nunca en el body scroll.
  - Cuando Search está abierto: SpotSheet no se renderiza (condición en MapScreenVNext).

- **MOTION_SHEET.md:** Añadida sección "8) SearchSheet (2-state)":
  - Duraciones open/close (300 ms abrir, 300/280 ms cerrar).
  - Threshold drag-to-dismiss (25% posición, velocity > 800 px/s).
  - Reduced motion (misma regla que §5).

## Archivos tocados

- `docs/contracts/EXPLORE_SHEET.md`
- `docs/contracts/MOTION_SHEET.md`
- `docs/ops/OPEN_LOOPS.md`
- `docs/bitacora/2026/02/073-ol-050e-search-spot-sheet-gestures-unified.md`

## Commits

- `chore(contracts): document search+spot sheet gesture rules`
- `chore(ops): close OL-050e + bitacora 073`

## QA

- SpotSheet: drag en handle/header → snap 3 estados; scroll en body sin arrastrar sheet.
- SearchSheet: abrir/cerrar; drag-to-dismiss desde handle/header; lista scrollea sin cerrar sheet.
- Con Search abierto: SpotSheet no aparece; al cerrar Search, SpotSheet visible si hay spot seleccionado.
