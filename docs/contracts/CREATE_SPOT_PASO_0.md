# CREATE_SPOT_PASO_0 — Contrato (Paso 0 "Nombre del spot")

**Fuente:** Bitácora 094, plan Paso 0. Contrato canónico del overlay de nombre antes del draft en mapa.

**Relación:** [CREATE_SPOT_INLINE_SHEET.md](CREATE_SPOT_INLINE_SHEET.md), [EXPLORE_SHEET.md](EXPLORE_SHEET.md).

---

## A) Propósito

- Todas las entradas de **Create Spot** desde Explorar pasan por un **Paso 0** que pide solo el **nombre** en un overlay sobre el mapa.
- Tap fuera cierra sin crear draft; confirmar nombre continúa al flujo de draft (sheet, ubicación, imagen) con ese nombre.

---

## B) Entradas que abren Paso 0

- **Dock (+):** Tras auth → `createSpotPendingCoords = getFallbackCoords()`, `createSpotInitialName = undefined`, overlay abierto.
- **Long-press en mapa (confirm):** Tras confirmar modal → coords del punto, `initialName` undefined, overlay abierto.
- **Búsqueda sin resultados — "Crear spot nuevo aquí":** Tras auth → coords y título desde búsqueda o fallback, `initialName = title`, overlay abierto; búsqueda se cierra.

---

## C) Estado (MapScreenVNext)

| Estado | Tipo | Descripción |
|--------|------|-------------|
| `createSpotNameOverlayOpen` | boolean | Overlay visible |
| `createSpotPendingCoords` | `{ lat, lng } \| null` | Coords con las que se abrirá el draft al confirmar |
| `createSpotInitialName` | `string \| undefined` | Prefill del input (solo desde búsqueda) |

Al abrir Paso 0 se setean los tres; al cerrar o confirmar se limpian.

---

## D) UI del overlay (CreateSpotNameOverlay)

- **Posición:** Parte superior del mapa (márgenes con insets); zIndex 16 (por encima de Search 15).
- **Contenido:** Label "Nombre del spot", un TextInput; fondo y bordes del **tema** (colors.background, borderSubtle).
- **Botón "Continuar y ajustar ubicación":** Flotante en la base, ancho completo, estilo pill como "Cómo llegar" (SpotSheet); **deshabilitado** si el nombre está vacío (trim); siempre visible (no depende del teclado). Indica que el siguiente paso es ajustar la ubicación en el mapa.
- **Tap fuera:** Backdrop a pantalla completa → `onDismiss` (cierra y limpia estado).
- **Animación:** Entrada del panel desde arriba (translateY + opacity, ~320 ms).

---

## E) Capas cuando Paso 0 está abierto

- **Ocultos:** MapPinFilter, MapControls, BottomDock (solo se ve mapa + overlay + Continuar).
- **Exclusión:** Search y SpotSheet no se muestran al mismo tiempo que Paso 0.
- **Owner de teclado:** Paso 0 es owner prioritario. Al abrir:
  - se cierra Search si estaba abierto,
  - se cierra quick edit de descripción si estaba abierto,
  - se ejecuta `blurActiveElement()` para liberar foco residual.
- **Guardrail de apertura inversa:** mientras Paso 0 está abierto, rutas secundarias que intentan abrir Search (ej. KPI de países) deben abortar.
- **Pin de preview:** Se muestra un pin para indicar dónde se creará el spot (MapCoreView `previewPinCoords`). Estado visual: selected (más grande). No interactivo.
  - **Durante Paso 0:** Pin en `createSpotPendingCoords`; label = valor actual del input (actualizado en tiempo real).
  - **Al seleccionar sugerencia de búsqueda (POI):** También cuando `poiTapped != null && selectedSpot == null`; pin en coords del POI, label = nombre del lugar. Bitácora 112.

---

## F) Confirmar ubicación (draft)

- En modo "Ajustar ubicación" (`isPlacingDraftSpot`), en el mapa se muestran **solo el pin del draft** (`displayedSpots = [selectedSpot]`); el resto de spots se ocultan.

---

## G) Post-creación

- Tras `handleCreateSpotFromDraft`: el spot recién creado queda **seleccionado** en el mapa y el **sheet en medium**.
- Para evitar que un efecto (selectedSpot debe estar en filteredSpots) deseleccione antes de que `refetchSpots()` termine: se hace `setSpots(prev => [...prev, created])` de forma **síncrona** antes de `setSelectedSpot(created)`.

---

## H) Archivos clave

- `components/explorar/MapScreenVNext.tsx`: estado, handlers, integración, ocultar controles, displayedSpots, post-creación, previewPinCoords.
- `components/explorar/MapCoreView.tsx`: prop `previewPinCoords` para pin de preview durante Paso 0.
- `components/explorar/CreateSpotNameOverlay.tsx`: overlay (props visible, initialName, onConfirm, onDismiss).
