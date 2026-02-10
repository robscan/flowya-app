# Bitácora 070 (2026/02) — OL-049: SearchSheet drag-to-dismiss (handle/header)

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** Permitir cerrar Search arrastrando hacia abajo desde handle/header, sin reintroducir estados intermedios (sigue 2-state: closed ↔ open_full).

## Contexto

- SearchFloating ya abre/cierra animado en 2 estados (OL-048).
- Faltaba gesto pull-down to close (estilo Apple Maps).
- Drag solo desde handle + header; el listado no debe iniciar drag (solo scroll).

## Implementación

- **Componente:** `components/search/SearchFloating.tsx`.
- **Gesture:** Pan (RNGH) solo en `dragArea` (handle + header), envuelto en `GestureDetector`.
- **Lógica:**
  - `onStart`: guardar `dragStartY = translateYShared.value`; `blurActiveElement()` (runOnJS) para quitar foco del input al iniciar drag.
  - `onUpdate`: `translateYShared.value = clamp(dragStartY + translationY, 0, screenHeight)`.
  - `onEnd`: si `translateY > 25% screenHeight` o `velocityY > 800` → animar a `screenHeight` y en callback `doClose()`; si no → snap back a 0 (220 ms).
- **Constantes:** DRAG_CLOSE_THRESHOLD 0.25, VELOCITY_CLOSE 800, SEARCH_DISMISS_MS 280, SEARCH_SNAP_BACK_MS 220.
- **Botón X:** sin cambios; sigue usando `requestClose` (animación programática).

## Archivos tocados

- `components/search/SearchFloating.tsx` (import Gesture/GestureDetector, panGesture, wrap dragArea).

## Commits

- `feat(search): add drag-to-dismiss for full-screen search sheet`
- `chore(ops): close OL-049 + bitacora 070`

## QA (obligatorio)

- Abrir Search → arrastrar handle hacia abajo poco → regresa a open_full.
- Arrastrar >25% o flick hacia abajo → cierra.
- Scroll del listado funciona y no mueve el sheet.
- Con input enfocado: al iniciar drag se hace blur y luego drag.
- Sin huecos/overlays fantasma al arrastrar.
