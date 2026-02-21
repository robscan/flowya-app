# Bitácora 096 (2026/02) — Map pins: tamaño seleccionado, animaciones, jerarquía z-index

**Fecha:** 2026-02-21  
**Objetivo:** (A) Ajustar tamaño del pin seleccionado estilo Apple Maps; (B) Añadir animaciones a MapPinSpot; (C) Jerarquía de capas: ubicación > seleccionado > resto.

---

## A) Tamaño pin seleccionado (estilo Apple Maps)

### Decisión

- **Antes:** 24px seleccionado, 12px reposo, icono 14px.
- **Después:** 36px seleccionado (referencia Apple Maps ~30–40px), 12px reposo, icono 20px, stroke 3px en seleccionado.

### Archivos

- `components/design-system/map-pins.tsx`: `SPOT_PIN_SELECTED_SIZE=36`, `SPOT_PIN_SELECTED_STROKE=3`, `SPOT_PIN_ICON_SIZE=20`.
- `app/design-system.web.tsx`: descripción Map pins actualizada.

---

## B) Animaciones MapPinSpot

### Decisión

- **Transición selected ↔ unselected:** Animar width/height 12↔36px (200 ms, easing cúbico).
- **Hover (solo reposo):** scale 1.08x (100 ms).
- **Press (solo reposo):** scale 0.95x (100 ms); cuando press está activo, hover se ignora.
- **Icono (to_visit/visited):** opacity 0→1 al pasar a seleccionado.

### Archivos

- `components/design-system/map-pins.tsx`: Reanimated `useSharedValue`, `useAnimatedStyle`, `withTiming`; constantes `PIN_SELECT_DURATION_MS`, `PIN_HOVER_PRESS_DURATION_MS`.
- `app/design-system.web.tsx`: descripción actualizada.

---

## C) Jerarquía z-index (orden de render)

### Decisión

En react-map-gl el orden de render determina el stacking (no z-index). Se reordena el render en MapCoreView:

1. Spots **no seleccionados** (orden original).
2. Spot **seleccionado** (si existe).
3. **Ubicación del usuario** (siempre encima).

Resultado: ubicación actual > spot seleccionado > resto de spots.

### Archivos

- `components/explorar/MapCoreView.tsx`: partition de spots en no-seleccionados y seleccionado; render en dos bloques; comentario de jerarquía en cabecera.

---

## D) Documentación

- `docs/contracts/MAP_PINS_CONTRACT.md`: contrato de tamaños, jerarquía y animaciones.
- `docs/contracts/INDEX.md`: entrada MAP_PINS_CONTRACT.

---

## QA manual (checklist)

- [ ] Pin seleccionado se ve ~36px, claramente más grande que reposo (12px).
- [ ] Transición suave al seleccionar/deseleccionar.
- [ ] Hover sobre pin en reposo: leve aumento de escala.
- [ ] Press sobre pin en reposo: leve disminución de escala.
- [ ] Ubicación del usuario siempre visible por encima del pin seleccionado cuando coinciden.
- [ ] Pin seleccionado visible por encima de otros spots no seleccionados.

---

## DoD

- AC de A, B y C; bitácora 096; contrato MAP_PINS; QA manual.
