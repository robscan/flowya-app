# Bitácora 078 (2026/02) — Search web overlay: fix móvil (viewport + scroll-lock + sin animación)

**Rama:** `fix/search-web-rebuild-overlay` (misma que 077)

## TL;DR

- Overlay anclado al **visual viewport** (top/left/width/height desde `visualViewport`): deja de “desaparecer” o dejar espacio blanco al abrir teclado en móvil.
- Scroll-lock reforzado: `body` con `position: fixed` + `top: -scrollY` y restauración con `window.scrollTo` al cerrar; evita que la pantalla completa se desplace al hacer scroll en la lista.
- Animación de entrada eliminada (Reanimated); panel es `View` estático. Evita rotura en la **segunda apertura** por estado de animación desincronizado.
- Viewport se refresca al abrir: `setViewportRect(getViewportRect())` cuando `controller.isOpen` pasa a true, para no depender de valores viejos tras cerrar teclado (p. ej. iOS).

---

## Problema observado (móvil, tras 077)

- Primera apertura: bien. Segunda apertura: se rompía (contenido descolocado o overlay mal dimensionado).
- Al abrir teclado: overlay podía “desaparecer” y quedar solo el cursor flotando; tras tap/drag reaparecía el listado.
- Al hacer scroll en la lista con teclado visible: la pantalla completa (fondo) se desplazaba y aparecía espacio blanco debajo.

---

## Causas identificadas

- Overlay con `top/left/right/bottom: 0` respecto al layout viewport: en iOS el viewport visual se reduce con el teclado y el overlay no seguía el rect visible.
- Scroll-lock solo con `overflow: hidden` en body: en iOS el documento/ventana seguía desplazable.
- Animación Reanimated (`translateY` shared value): al cerrar y reabrir, el estado de la animación no se reseteaba de forma fiable → segunda apertura con layout/posición incorrectos.
- Viewport: tras cerrar teclado, `visualViewport` en iOS puede quedar con offset/height desactualizados; reabrir sin refrescar daba dimensiones erróneas.

---

## Cambios realizados

### SearchOverlayWeb.tsx

1. **Overlay anclado al visual viewport**
   - Estado `viewportRect = { top, left, width, height }` desde `visualViewport.offsetTop/offsetLeft/width/height` (fallback `window.innerWidth/innerHeight`).
   - Contenedor del overlay con `position: 'absolute'` y esas cuatro propiedades en píxeles (no `right/bottom: 0`). El overlay cubre exactamente el rect visible; al abrir el teclado el rect se reduce y el overlay con él.

2. **Scroll-lock robusto (iOS)**
   - Al abrir: guardar `scrollY`, aplicar a `body`: `position: 'fixed'`, `top: -scrollY`, `left/right: 0`, `overflow: 'hidden'`, `overscrollBehavior: 'none'`.
   - Al cerrar (cleanup): quitar esos estilos y `window.scrollTo(0, savedScrollY)`.

3. **Sin animación de entrada**
   - Eliminados Reanimated (`useSharedValue`, `useAnimatedStyle`, `withTiming`), `Animated.View` y constantes de entrada. Panel es un `View`; aparece ya en posición final.

4. **Refresh de viewport al abrir**
   - `useEffect` con dependencia `[controller.isOpen, getViewportRect]`: cuando `isOpen` es true, `setViewportRect(getViewportRect())`. Garantiza dimensiones correctas en cada apertura (incl. 2ª y siguientes).

5. **Sin padding de teclado**
   - Eliminados `keyboardHeight` y `KEYBOARD_EXTRA_PADDING`; el contenido visible es el rect del visual viewport (el teclado queda fuera).

6. **Web: touch-action**
   - En el overlay (solo web) se aplica `touchAction: 'none'` para reducir rubber-band.

---

## Archivos tocados

- `components/search/SearchOverlayWeb.tsx` (viewport rect, scroll-lock body, eliminación animación, refresh al abrir).

---

## Referencias

- Bitácora 077: implementación inicial del overlay (router, overlayScrim, scroll-lock básico).
- OL-052d: Search web rebuilt as overlay; con este fix queda validado en móvil.
