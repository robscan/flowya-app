# Bitácora 064 (2026/02) — OL-036: Drag + snap (collapsed/medium/expanded) para ExploreSheet

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** Implementar arrastre y snap a 3 alturas en SpotSheet según MOTION_SHEET.md (web-first).

---

## Cambios

- **SpotSheet (components/explorar/SpotSheet.tsx):**
  - Contenedor con altura fija = anchor expanded (90% viewport) y `translateY` animado (Reanimated). Anchors: collapsed 96 px, medium 60% vh, expanded 90% vh.
  - Pan gesture (react-native-gesture-handler) solo en handle + header (`dragArea`), sin tocar cuerpo/scroll.
  - Snap al soltar: umbral 25% del camino + velocity (≥400 px/s) para decidir estado; animación con withTiming (300 ms, easing cubic-bezier 0.4,0,0.2,1). Un solo driver: no animación programática durante drag.
  - Tap en header/handle: snap al siguiente estado con duraciones 280/320 ms según MOTION_SHEET.
  - Reduced motion: `usePrefersReducedMotion()` (matchMedia en web); duración 0 cuando activo.
  - `onSheetHeightChange` reporta la altura del anchor del estado actual (para overlay de controles en MapScreenVNext).

- **app/_layout.tsx:** Envolvido en `GestureHandlerRootView` para que el Pan gesture funcione.

- **docs/contracts/EXPLORE_SHEET.md:** Añadidas notas en §7 (Layout) con anchors de implementación (96 px, ~60%, ~90%) y referencia a MOTION_SHEET.

- OPEN_LOOPS: OL-036 marcado DONE tras QA (drag 10× search/spot, sin temblores; scroll lista OK; consola limpia).
