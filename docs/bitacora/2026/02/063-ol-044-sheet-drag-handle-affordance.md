# Bitácora 063 (2026/02) — OL-044: Drag handle affordance para ExploreSheet (web-first)

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** Mostrar un drag handle visible en el header del sheet (ExploreSheet/SpotSheet/SearchFloating) con estados hover/active sutiles en web.

---

## Cambios

- **Design System:** Creado `components/design-system/sheet-handle.tsx` (SheetHandle).
  - Barra minimal: ~36px ancho, 4px alto, border-radius 2. Color `textSecondary`.
  - Web: hover y active con cambio de opacidad (0.7 → 0.95); sin sombras ni blur.
  - Prop opcional `onPress` para que el tap en el handle propague acción (ej. expandir/colapsar).
  - Documentado como canónico en docs/contracts/DESIGN_SYSTEM_USAGE.md.

- **SpotSheet:** Handle insertado encima del header row; `onPress={handleHeaderTap}` para expandir/colapsar. `SHEET_PEEK_HEIGHT` actualizado a 96 (handle + header). Estilo `handleRow` con marginBottom 4.

- **SearchFloating:** Handle insertado encima del header (search pill + close); solo affordance visual. Estilo `handleRow` con paddingTop 8, marginBottom 4.

- OPEN_LOOPS: OL-044 marcado DONE (ver en `/` en web: handle visible en search y en spot sheet).
