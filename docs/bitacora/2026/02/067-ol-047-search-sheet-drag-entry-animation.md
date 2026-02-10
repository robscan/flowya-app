# Bitácora 067 (2026/02) — OL-047: Search sheet drag + entry/exit animation

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** Search (mode search) con entry/exit animado, drag mínimo sin viewport drag ni fondo blanco.

---

## Causa raíz

- SearchFloating era un fragment (backdrop + View con `top: sheetTop`, `bottom: 0`): sin altura fija desde bottom, sin translateY, sin gesture. Al intentar “arrastrar” no había capa que capturara el gesto → el navegador hacía scroll/viewport move y se veía fondo blanco.
- No había animación de entrada ni salida (mount/unmount directo).

## Cambios (fix canónico)

- **Mismo patrón que SpotSheet:** root fijo + panel con translateY (MOTION_SHEET).
  - **sheetRoot:** View, `position: absolute`, `left: 0`, `right: 0`, `bottom: 0`, `height: expandedAnchor` (85% vh), `overflow: hidden`, fondo sólido, zIndex 15. No se mueve.
  - **sheetPanel:** Animated.View con `height: expandedAnchor`, mismo fondo, `transform: translateY`. Solo el panel se anima.
- **Entry:** al montar (`controller.isOpen === true`), `translateY` pasa de `expandedAnchor` a `0` con withTiming(300 ms, easing cubic-bezier 0.4,0,0.2,1).
- **Exit:** al cerrar (backdrop o botón X) se anima `translateY` a `expandedAnchor` y en el callback se llama `controller.setOpen(false)` (sin unmount brusco).
- **Drag:** Gesture.Pan solo en handle + header (`dragArea`). Anchors: collapsed 120 px, expanded 85% vh. Snap por posición (25%) y velocity; si se arrastra muy abajo + velocity → cierre animado.
- Reutilización de SheetHandle (DS). Sin scrims extra. SpotSheet no tocado.

- OPEN_LOOPS: OL-047 DONE (QA: entrada/salida animada, drag mueve sheet sin viewport, sin blanco).
