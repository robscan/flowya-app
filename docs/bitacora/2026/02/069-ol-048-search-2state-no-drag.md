# Bitácora 069 (2026/02) — OL-048: SearchFloating 2-state (closed/open_full), no drag, keyboard-safe

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** Search solo dos estados (pill cerrado | sheet full abierto), sin drag ni estados intermedios. UX tipo Apple Maps.

## Contexto

- SpotSheet mantiene 3 estados + drag/snap y funciona.
- Search no debe mover mapa; no se necesita drag ni collapsed/medium/expanded.

## Implementación (ya aplicada)

- **Componente:** `components/search/SearchFloating.tsx` (usado en `MapScreenVNext.tsx`).
- **Estado:** `searchV2.isOpen` (controller) como source of truth. `isOpen=false` → no se renderiza sheet (solo pill en dock). `isOpen=true` → sheet full-height.
- **Estructura cuando isOpen=true:**
  - **sheetWrapper:** `position: 'absolute'`, `top: 0`, `bottom: 0`, `left: 0`, `right: 0`, `backgroundColor: 'transparent'`, `zIndex` alto.
  - **Scrim:** full-screen `rgba(0,0,0,0.25)`, `Pressable` con tap-to-close.
  - **sheetRoot:** `position: 'absolute'`, `left: 0`, `right: 0`, `top: 0`, `bottom: 0`, fondo sólido del sheet, bordes redondeados arriba. Sin hueco arriba/abajo.
  - Contenido interno: `flex: 1`, `minHeight: 0` en lista/keyboardAvoid.
- **Animación:** Reanimated `translateY`. Cerrado (no montado). Abierto: de `screenHeight` → `0` (300 ms ease-in-out). Cierre: animar a `screenHeight` y en callback `controller.setOpen(false)`. Sin gestures (RNGH eliminado).
- **Keyboard-safe:** `KeyboardAvoidingView` con `behavior='padding'` en iOS; lista con `flex: 1`, `minHeight: 0`; `keyboardShouldPersistTaps="handled"` en ScrollViews.
- **Body scroll lock (web):** `document.body.style.overflow = 'hidden'` cuando `isOpen`, cleanup al cerrar.
- **SpotSheet:** Oculto cuando Search abierto: `selectedSpot != null && !searchV2.isOpen` (MapScreenVNext, ya existente).

## Archivos tocados

- `components/search/SearchFloating.tsx` (2 estados, sin PanGesture, full-height, scrim + wrapper transparent + sheetRoot sólido).
- `docs/ops/OPEN_LOOPS.md` (OL-048 cerrado).
- `docs/bitacora/2026/02/069-ol-048-search-2state-no-drag.md` (esta entrada).

## Commits

- `feat(search): make search sheet two-state (closed/open_full) without drag`
- `chore(ops): close OL-048 + bitacora 069`

## QA (obligatorio)

**Web:** Abrir/cerrar 10 veces; scroll body bloqueado al abrir; sin overlays fantasma.  
**Mobile:** Teclado no tapa lista; sin gaps ni doble fondo.
