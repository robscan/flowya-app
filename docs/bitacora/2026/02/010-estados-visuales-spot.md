# Bitácora 010 (2026/02) — Estados visuales de Spot: reposo vs seleccionado

**Micro-scope:** B1-MS4  
**Estado:** Cerrado  
**Archivo tocado:** `components/design-system/map-pins.tsx`

---

## Objetivo

Definir dos estados visuales claros para los pins de spot: **reposo** (no seleccionado) = tamaño base, sin icono; **activo** (seleccionado) = grande, con icono si to_visit/visited. Reducir ruido visual en mapas densos.

---

## Cambios realizados

### MapPinSpot

- **Tamaño:** `isLargePin` pasa de `isSavedPin || selected` a **`selected`**. En reposo todos los spots usan SPOT_PIN_SIZE (12); solo el seleccionado usa SPOT_PIN_SAVED_SIZE (24).
- **Icono:** el icono Pin se muestra solo cuando **`selected && isSavedPin`** (antes solo `isSavedPin`). En reposo no hay icono; en activo se muestra si el status es to_visit o visited.
- **Color:** sin cambios; `getSpotPinFillColor(colors, status)` sigue definiendo el color por status en ambos estados.
- **Comentarios:** actualizados el comentario de cabecera del archivo y el JSDoc de MapPinSpot para describir la regla reposo/activo.

---

## Criterio de cierre

- Varios spots visibles en reposo: todos tamaño base, sin icono.
- Al seleccionar uno: solo ese pasa a grande y (si aplica) con icono.
- **npm run build:** OK.

---

## Rollback

Revert del commit del micro-scope. Sin migraciones; estado previo recuperable.
