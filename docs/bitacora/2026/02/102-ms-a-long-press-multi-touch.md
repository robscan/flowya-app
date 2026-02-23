# Bitácora 102 (2026/02) — MS-A: Long-press solo un dedo (OL-P0-003)

**Fecha:** 2026-02-14

**Objetivo:** Create spot solo por long-press de un dedo; pinch/zoom no debe disparar el flujo.

---

## Cambios realizados

- **`hooks/useMapCore.ts`:**
  - Nueva función `isMultiTouch(e)`: detecta si hay más de un dedo (`originalEvent.touches.length > 1`). Para mouse, retorna false.
  - En `handleMapPointerDown`: si `isMultiTouch(e)` → `clearLongPressTimer()` y return (no iniciar timer).
  - En `handleMapPointerMove`: si `isMultiTouch(e)` → `clearLongPressTimer()` y return (cancelar si pinch detectado durante gesto).
- **`docs/contracts/CREATE_SPOT_LONG_PRESS.md`:** Estado ACTIVE.

---

## Pruebas recomendadas

- Smoke: pinch/zoom en mapa 10 veces sin que se active create spot.
- Smoke: long-press con un dedo durante 3s → create spot se activa.
