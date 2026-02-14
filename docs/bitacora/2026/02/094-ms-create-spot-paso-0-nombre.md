# Bitácora 094 (2026/02) — Create Spot Paso 0 "Nombre del spot" (overlay sobre mapa)

**Fecha:** 2026-02-14  
**Objetivo:** Añadir un **Paso 0** que pide solo el nombre en un overlay sobre el mapa (parte superior). Todas las entradas de Create Spot pasan por este paso; tap fuera cierra sin efectos; confirmar continúa al draft existente con el nombre inyectado.

---

## Decisión UX

- **Paso 0:** Overlay en la parte superior del mapa con un único input "Nombre del spot", copy tipo Apple, botón "Continuar" flotante abajo (estilo "Cómo llegar", ancho completo). Submit con Enter.
- **Entradas:** Dock (+), long-press (confirm modal), search "Crear spot nuevo aquí". Todas abren primero el Paso 0; al confirmar nombre se llama `startDraftCreateSpot(coords, name)` y se sigue el flujo mínimo (sheet, ubicación, imagen).
- **Tap fuera:** Cierra el overlay y vuelve al mapa; no se crea draft ni se dejan overlays residuales.
- **Post-creación:** Al finalizar creación desde este flujo, el spot recién creado queda **seleccionado en el mapa** con **sheet en medium**.

---

## Arquitectura (notas)

- **Estado canónico del Paso 0** (MapScreenVNext):
  - `createSpotNameOverlayOpen: boolean` — si el overlay está visible.
  - `createSpotPendingCoords: { lat, lng } | null` — coords con las que se abrirá el draft al confirmar (set al abrir Paso 0 desde +, long-press o search).
  - `createSpotInitialName: string | undefined` — valor inicial del input (solo desde search; dock/long-press sin prefill).
- **Capas:** Orden z-index: Mapa &lt; controles (10) &lt; BottomDock (12) &lt; Search overlay (15) &lt; **CreateSpotNameOverlay (16)**. Cuando Paso 0 está abierto se ocultan **filtros, MapControls y BottomDock** para que solo se vea el objeto flotante y el botón Continuar; exclusión mutua con Search/Sheet.
- **Tap fuera:** Un único backdrop a pantalla completa con `onPress = onDismiss`; en web y móvil el toque "fuera del input" cierra sin guardar y limpia estado.

---

## Entregables

1. **MapScreenVNext**
   - Estado: `createSpotNameOverlayOpen`, `createSpotPendingCoords`, `createSpotInitialName`.
   - Abrir Paso 0: `handleOpenCreateSpot` (dock +), long-press confirm, `handleCreateFromNoResults` (search). En todos los casos se setean coords (y `initialName` solo desde search) y `setCreateSpotNameOverlayOpen(true)`.
   - Cerrar: `handleCloseCreateSpotNameOverlay` limpia los tres estados.
   - Confirmar: `onConfirmCreateSpotName(name)` → `startDraftCreateSpot(createSpotPendingCoords, name.trim() || "Nuevo spot")` y limpia estado del Paso 0.
   - Al confirmar ubicación (modo draft): **solo el draft** se muestra en el mapa (`displayedSpots = [selectedSpot]` cuando `isPlacingDraftSpot`).
   - Post-creación: `setSpots(prev => [...prev, created])` síncrono antes de `setSelectedSpot(created)` para que el efecto "selectedSpot debe estar en filteredSpots" no borre la selección; luego `setSheetState("medium")`.

2. **CreateSpotNameOverlay** (`components/explorar/CreateSpotNameOverlay.tsx`)
   - Props: `visible`, `initialName?`, `onConfirm(name)`, `onDismiss`.
   - Panel superior (márgenes, tema): label "Nombre del spot", TextInput; **sin** botón dentro del panel. Fondo y bordes del **tema** (colors.background, colors.borderSubtle).
   - Botón "Continuar" **flotante** en la base: ancho completo, estilo pill como "Cómo llegar" (SpotSheet), centrado; **deshabilitado** si el usuario no ingresa nombre (opacity 0.6, colors.textSecondary); siempre visible (no depende del teclado).
   - Animación de entrada: panel desliza desde arriba (translateY + opacity), ~320 ms.
   - En web: contenedor con `height: var(--app-height, 100dvh)` para teclado sin saltos.

3. **Integración**
   - Overlay renderizado cuando `createSpotNameOverlayOpen`, después de BottomDock y antes de SearchFloating. `startDraftCreateSpot` no cambia de firma; solo se llama con el nombre que sale del Paso 0.

---

## Refinamientos (misma sesión)

- **Buscador:** Botón Cerrar (X) en estado **activo** (fondo primary, icono claro) como los controles del mapa — SearchOverlayWeb y SearchFloatingNative con `IconButton selected`.
- **Sin resultados de búsqueda:** Zona táctil debajo del contenido (sugerencias + "Crear spot nuevo aquí") que cierra el buscador al tocar ("tap en el mapa" para volver).
- **Contrato post-creación:** Spot seleccionado + sheet medium; fix de arquitectura con `setSpots(prev => [...prev, created])` síncrono para evitar que el efecto de "selectedSpot en filteredSpots" deseleccione antes de que `refetchSpots()` termine.

---

## Archivos tocados

- `components/explorar/MapScreenVNext.tsx`: estado Paso 0, handlers, entradas, ocultar filtros/controles/dock cuando Paso 0 abierto, displayedSpots solo draft al confirmar ubicación, post-creación setSpots + sheet medium.
- `components/explorar/CreateSpotNameOverlay.tsx`: overlay (zIndex 16, tema, tap fuera, Continuar flotante, deshabilitado sin nombre, animación entrada).
- `components/search/SearchOverlayWeb.tsx`: IconButton Cerrar con `selected`; sin resultados → noResultsWrap + tapToCloseMapArea.
- `components/search/SearchFloatingNative.tsx`: IconButton Cerrar con `selected`; sin resultados → noResultsWrap + tapToCloseMapArea.

---

## QA manual (checklist)

- [ ] Desde Explorar → tap **(+)** → aparece Paso 0 con input arriba, mapa visible; filtros y dock ocultos.
- [ ] Tap fuera → cierra y vuelve al mapa sin overlays residuales.
- [ ] Sin nombre: botón Continuar deshabilitado (gris, no envía).
- [ ] Con nombre: Continuar → draft en sheet; ajustar ubicación → solo el pin del draft en el mapa.
- [ ] Finalizar creación → spot nuevo **seleccionado** en el mapa, **sheet en medium**.
- [ ] Long-press → confirm → Paso 0 → nombre → draft. Search sin resultados → Paso 0 con nombre prefilled → Continuar → draft.
- [ ] Buscador: X en estado activo (fondo primary, icono claro). Sin resultados: tocar zona inferior cierra buscador.
- [ ] Consola sin errores relevantes.

---

## DoD

- AC del plan; bitácora 094; notas de arquitectura; refinamientos documentados; contrato [CREATE_SPOT_PASO_0.md](../../../contracts/CREATE_SPOT_PASO_0.md); QA manual.
