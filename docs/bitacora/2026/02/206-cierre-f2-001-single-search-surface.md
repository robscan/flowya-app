# 206 — Cierre OL-WOW-F2-001 Single Search Surface

Fecha: 2026-02-28  
Tipo: cierre operativo / OL-WOW-F2-001

## Contexto
OL-WOW-F2-001 (Single Search Surface): unificar árbol de contenido de búsqueda entre web y native mediante componente compartido.

## Implementación
- **SearchSurface.tsx** (nuevo): árbol de contenido unificado (filtros, search input, activity summary, resultados). 4 estados: isEmpty, isPreSearch, isSearch, isNoResults. Props plataforma: onScrollDismissKeyboard (web), scrollViewKeyboardDismissMode (native), onInputFocus/onInputBlur (web). renderItem genérico compatible con Spot | PlaceResult.
- **SearchOverlayWeb.tsx**: refactorizado para usar SearchSurface. Mantiene overlay, backdrop, scroll-lock body, visualViewport/100dvh. Eliminadas ~200 líneas duplicadas.
- **SearchFloatingNative.tsx**: refactorizado para usar SearchSurface. Mantiene sheet, GestureDetector, SheetHandle, KeyboardAvoidingView. Eliminadas ~200 líneas duplicadas.
- **components/search/index.ts**: exporta SearchSurface y SearchSurfaceProps.

## Validación
- Smoke comparativo web/native: isEmpty, isPreSearch, isSearch, isNoResults — OK (confirmado en localhost).

## Cambios
- `docs/ops/OPEN_LOOPS.md`: OL-WOW-F2-001 → CERRADO.
- `docs/ops/CURRENT_STATE.md`: actualización con cierre F2-001.

## Resultado
- OL-WOW-F2-001 cerrado. F2-001-SEARCH y F2-001-EMPTY desbloqueados para ejecución.
