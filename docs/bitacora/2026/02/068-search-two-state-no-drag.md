# Bitácora 068 (2026/02) — Search dos estados (closed / open_full), sin drag

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** Simplificar Search a solo dos estados: pill cerrado o sheet abierto full-height. Sin drag ni collapsed/medium/expanded.

## Cambios

- **SearchFloating:** Eliminados PanGesture, GestureDetector y toda la lógica de snap (collapsed/expanded, velocity, threshold).
- **Estados:** Solo `closed` (no se renderiza el sheet) y `open_full` (sheet ocupa top:0; bottom:0; left:0; right:0).
- **Animación:** Programática con Reanimated: abrir = translateY(screenHeight) → 0; cerrar = translateY(0) → screenHeight, luego `controller.setOpen(false)`.
- **Estructura:** `sheetWrapper` full-screen con `backgroundColor: 'transparent'`; scrim `rgba(0,0,0,0.25)` con tap-to-close; `sheetRoot` full-screen con fondo sólido; panel con translateY.
- **Keyboard-safe:** Se mantiene KeyboardAvoidingView y body scroll lock. SpotSheet no tocado.

## Commits

- `feat(search): make search sheet two-state (closed/open) with programmatic animation`

## QA

- Cerrado: pill visible. Abierto: sheet full-height, animación suave. Lista scrollea; input y teclado sin empalme. Cerrar (X o scrim) vuelve al pill.
