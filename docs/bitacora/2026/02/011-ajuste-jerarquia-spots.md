# Bitácora 011 (2026/02) — Ajuste fino de jerarquía visual entre tipos de Spot

**Micro-scope:** B1-MS5  
**Estado:** Cerrado  
**Archivo tocado:** `components/design-system/map-pins.tsx`

---

## Objetivo

Consolidar nombres y documentar la jerarquía visual canónica (protagonista vs reposo) sin cambiar comportamiento. Opción B: stroke se mantiene en 2 para reposo y seleccionado.

---

## Cambios realizados

- **Constantes renombradas:** `SPOT_PIN_SAVED_SIZE` → `SPOT_PIN_SELECTED_SIZE` (24), `SPOT_PIN_SAVED_STROKE` → `SPOT_PIN_SELECTED_STROKE` (2). Referencias actualizadas en `MapPinSpot`.
- **MAP_PIN_SIZES:** clave `spotSaved` → `spotSelected`, valor `SPOT_PIN_SELECTED_SIZE`.
- **Comentario de jerarquía:** bloque antes de las constantes de spot describiendo Nivel 1 (protagonista / seleccionado), Nivel 2 (reposo), Nivel 3 (mapa base). Comentarios inline en `SPOT_PIN_SIZE` (Nivel 2) y `SPOT_PIN_SELECTED_SIZE` (Nivel 1).
- **Comentario heredado eliminado:** sustituido "2× para to_visit y visited" por la descripción de tamaño protagonista.
- **Stroke:** sin cambio (ambos 2).

---

## Criterio de cierre

- Nombres alineados a reposo vs seleccionado; jerarquía documentada.
- Build limpio.

---

## Rollback

Revert del commit del micro-scope. Sin migraciones; estado previo recuperable.
