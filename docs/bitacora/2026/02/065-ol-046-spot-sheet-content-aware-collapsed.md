# Bitácora 065 (2026/02) — OL-046: SpotSheet collapsed content-aware sizing

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** Hacer el anchor collapsed del SpotSheet content-aware (altura real del header) sin romper drag+snap.

---

## Cambios (fix aplicado)

- **SpotSheet:** Anchor collapsed ya no es fijo 96 px.
  - Se mide la altura del área de drag (handle + header) con `onLayout` en el contenedor `dragArea`.
  - `collapsedAnchor = HEADER_PADDING_V (12) + dragAreaHeight` cuando hay medición; fallback `ANCHOR_COLLAPSED_PX` (96) cuando `dragAreaHeight === 0` (antes del primer layout).
  - Medium y expanded siguen como % viewport (60%, 90%). Drag, snap y tap sin cambios.

- OPEN_LOOPS: OL-046 marcado DONE (fix probado en web: collapsed muestra header completo, drag snappea a 3 estados).

- CURRENT_STATE: sin cambio (no queda pendiente).
