# Bitácora 099 (2026/02) — Map overlays redesign + Search entry icon + FLOWYA + Keyboard + MapControls fix

**Fecha:** 2026-02-14  
**Objetivo:** Rediseñar overlays del mapa, entry point de búsqueda como icono, FLOWYA abajo-izquierda, paddings consistentes, contrato teclado aplicado, alineación MapControls con botón Search.

---

## Cambios realizados

### 1. Entry point de búsqueda (icono solo, derecha)
- **Antes:** BottomDock con SearchPill (pill blanco + texto "Buscar spots") centrado abajo.
- **Después:** IconButton con icono Search (44×44), alineado a la derecha.
- **Posición:** `bottom: dockBottomOffset + insets.bottom`, `right: CONTROLS_OVERLAY_RIGHT + insets.right`.
- **Visibilidad:** `selectedSpot == null && !createSpotNameOverlayOpen && !searchV2.isOpen`.

### 2. FLOWYA label (abajo-izquierda)
- **Posición:** `left: TOP_OVERLAY_INSET + insets.left`, `bottom: dockBottomOffset + insets.bottom`.
- **Tap:** Abre FlowyaBetaModal.
- **Visibilidad:** `!createSpotNameOverlayOpen && !searchV2.isOpen`.

### 3. Padding consistente en overlays
- Filter overlay, MapControls: insets para safe area.
- Separación MapControls ↔ Search: `SEARCH_ICON_HEIGHT = 44`, `CONTROLS_TO_SEARCH_GAP = 8`.

### 4. MapControls — fix alineación con Search
- **Problema:** Contenedor MapControls tenía `padding: Spacing.xs` (4px) en todos los lados, generando desfase visual respecto al botón Search.
- **Solución:** Eliminar padding del contenedor; usar solo `gap: Spacing.xs` entre botones. Controles y Search quedan alineados por la derecha.

### 5. Panel Search — layout y filtros
- Fila 1: MapPinFilterInline + botón cerrar.
- Fila 2: Input búsqueda ancho completo.
- MapPinFilterInline: pills en línea; MapPinFilter del mapa se oculta cuando search abre.

### 6. Contrato KEYBOARD_AND_TEXT_INPUTS
- CreateSpotNameOverlay, Auth modal: CTA sticky sobre teclado.
- Search, Edit Spot, Create Spot: `keyboardDismissMode="on-drag"`; web: onScroll blur.

---

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `components/explorar/MapScreenVNext.tsx` | Search icon overlay, FLOWYA label, paddings |
| `components/design-system/map-controls.tsx` | Eliminar padding 4px del contenedor |
| `components/design-system/map-pin-filter-inline.tsx` | Nuevo (bitácora 098) |
| `components/search/SearchFloatingNative.tsx`, `SearchOverlayWeb.tsx` | Layout filas, MapPinFilterInline |
| `components/explorar/CreateSpotNameOverlay.tsx` | CTA sticky teclado |
| `contexts/auth-modal.tsx` | CTA sticky web |
| `app/spot/edit/[id].tsx`, `[id].web.tsx` | keyboardDismissMode |
| `app/create-spot/index.web.tsx` | keyboardDismissMode |
| `components/search/SearchResultsListV2.tsx` | keyboardDismissMode, onScrollDismissKeyboard |
