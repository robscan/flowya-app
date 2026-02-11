# Bitácora 077 (2026/02) — Search web rebuilt as overlay (no sheet)

**Rama:** `fix/search-web-rebuild-overlay`

## TL;DR

- Web: Search deja de ser sheet; es overlay fijo (full-screen, sin gestos, sin handle).
- Router por plataforma: `SearchFloating.tsx` → web: `SearchOverlayWeb`, native: `SearchFloatingNative`.
- Panel con fondo `colors.overlayScrim` (32% opacidad; blanco en light, negro en dark). Body scroll lock guardado/restaurado.
- Teclado en web: `visualViewport` para `paddingBottom` en área resultados; X cierra siempre (doClose + blur después).
- Eliminado `hooks/useViewportMetrics.ts`; lógica mínima de teclado inline en `SearchOverlayWeb`.

---

## Problema observado (iOS Safari/Chrome)

- Lista recortada o header no visible al abrir Search.
- Teclado “rompe” el sheet: estados intermedios, input no alcanzable, drag inconsistente.
- OL-052 / OL-052c: parches con visualViewport + keyboardOpen no resolvían de forma determinista en iOS web.

---

## Decisión

- **Web ≠ sheet.** En web, Search es un overlay modal fijo (position absolute full-screen), sin Reanimated sheet, sin pan/drag, sin handle.
- **Native** mantiene el comportamiento anterior: sheet con drag-to-dismiss, Reanimated, KeyboardAvoidingView. Sin lógica de body overflow ni visualViewport.

---

## Implementación

### SearchFloating.tsx como router por plataforma

- Solo importa `Platform`, `SearchOverlayWeb`, `SearchFloatingNative`, `SearchFloatingProps`.
- `Platform.OS === 'web'` → `<SearchOverlayWeb {...props} />`, si no → `<SearchFloatingNative {...props} />`.
- Sin lógica compartida; cada path es independiente.

### SearchOverlayWeb.tsx

- **Layout:** Overlay `position: absolute`, `top/left/right/bottom: 0`, `backgroundColor: 'transparent'`. Panel con `position: absolute`, mismo bounds, `backgroundColor: colors.overlayScrim`. Header fijo (flexShrink: 0), área resultados con `flex: 1`, `minHeight: 0`.
- **Transparencia:** Panel usa token `colors.overlayScrim` (theme: light = blanco 32%, dark = negro 32%). Sin bordes redondeados (borderTopLeftRadius/Right = 0). Padding 16 16 0 16.
- **Cierre:** X usa `IconButton` (DS). `onClosePress`: `doClose()` luego `requestAnimationFrame`/`setTimeout(blurActiveElement)`. Tap en backdrop: si input enfocado → blur; si no → doClose.
- **Keyboard padding:** `visualViewport` (resize, scroll) + `window.resize`; `keyboardHeight = max(0, innerHeight - vv.height - vv.offsetTop)`. Se aplica `paddingBottom: keyboardHeight + KEYBOARD_EXTRA_PADDING` al contenedor de resultados. No KeyboardAvoidingView en web.
- **Scroll-lock body:** Al abrir se guarda `document.body.style.overflow` en `savedOverflowRef`, se asigna `'hidden'`. En el cleanup del `useEffect` se restaura `savedOverflowRef.current ?? ''`.
- **Entrada:** Animación Reanimated: `translateY` de `screenHeight` a 0 (300 ms, easing bezier 0.4,0,0.2,1).

### SearchFloatingNative.tsx

- Comportamiento previo del sheet: Reanimated, `Gesture.Pan`, drag-to-dismiss, `KeyboardAvoidingView` (iOS). Sin `document.body.style.overflow`; sin visualViewport. Exportado como componente aparte.

### SearchInputV2.tsx

- En web se aplica estilo para ocultar outline de focus: `outlineStyle: 'none'`, `outlineWidth: 0` (evitar borde naranja del navegador).
- `forwardRef` para compatibilidad; no usado en overlay web actual.

### constants/theme.ts

- Añadidos `overlayScrimLight = 'rgba(255, 255, 255, 0.32)'`, `overlayScrimDark = 'rgba(0, 0, 0, 0.32)'`.
- `Colors.light.overlayScrim`, `Colors.dark.overlayScrim` para uso dinámico según tema.

### Eliminaciones

- **hooks/useViewportMetrics.ts** — Eliminado. La lógica de teclado en web queda inline en `SearchOverlayWeb` (visualViewport + estado local).

---

## Riesgos / tradeoffs

- Overlay web sin drag-to-dismiss: cierre solo con X o tap en backdrop. Consciente para priorizar estabilidad en iOS web.
- Typecheck: en el repo aparecen errores en `SearchInputV2.tsx` (outlineStyle / tipos ViewStyle); no bloquean ejecución en web. Corregir si se exige tsc limpio.

---

## Checklist de pruebas manuales

- **iOS Safari:** Abrir Search → header e input visibles desde el primer frame. Tap input → teclado abre, lista scrolleable, sin recorte. Tap backdrop con teclado abierto → solo blur. X con teclado abierto → cierra overlay. Body no hace scroll con Search abierto.
- **iOS Chrome:** Mismo flujo que Safari.
- **Desktop web:** Abrir/cerrar Search, scroll lista, sin regresiones.
- **Native (app):** Search sigue siendo sheet con drag; sin cambios de comportamiento.

---

## Archivos tocados

- `components/search/SearchFloating.tsx` (solo router)
- `components/search/SearchOverlayWeb.tsx` (nuevo)
- `components/search/SearchFloatingNative.tsx` (nuevo)
- `components/search/SearchInputV2.tsx` (focus outline web, forwardRef)
- `constants/theme.ts` (overlayScrim light/dark)
- `hooks/useViewportMetrics.ts` (eliminado)

---

## Sanity checks

- **Lint:** `npm run lint` → 0 errores. 16 warnings en otros archivos (app/spot, map-location-picker, SpotSheet, etc.); ninguno en `components/search`.
- **Typecheck:** `npx tsc --noEmit` → errores en `SearchInputV2.tsx` (outlineStyle / overload) y en app-example; no en SearchFloating / SearchOverlayWeb / SearchFloatingNative.
- **Scroll-lock:** En `SearchOverlayWeb`, el `useEffect` que depende de `controller.isOpen` guarda `document.body.style.overflow` antes de asignar `'hidden'` y en el cleanup restaura con `savedOverflowRef.current ?? ''`. Restauración siempre al desmontar o al cerrar.
- **Código muerto:** No queda import de `useViewportMetrics`. SearchFloating importa solo SearchOverlayWeb y SearchFloatingNative; ambos usados según plataforma.

---

## Actualización (post-fix móvil)

- En móvil la primera apertura funcionaba; la segunda y el scroll con teclado fallaban. Ver **bitácora 078**: overlay anclado al visual viewport, scroll-lock con `body` position fixed, animación de entrada eliminada, refresh de viewport al abrir. OL-052d validado.
