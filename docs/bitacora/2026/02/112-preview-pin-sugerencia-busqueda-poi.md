# Bitácora 112 — Preview pin al seleccionar sugerencia de búsqueda (POI)

**Fecha:** 2026-02-22  
**Relación:** CREATE_SPOT_PASO_0, MS-B (Pin visible Paso 0), flujo search → POI → create

---

## Cambios

### Extensión de previewPinCoords / previewPinLabel

- **Antes:** El pin de preview solo se mostraba durante Paso 0 (`createSpotNameOverlayOpen && createSpotPendingCoords`).
- **Ahora:** También cuando `poiTapped != null && selectedSpot == null`.

Al seleccionar una sugerencia de lugar en Search (sin resultados), el mapa:
1. Hace flyTo a las coordenadas del POI.
2. Muestra el pin de preview en esa posición, con label = nombre del lugar.

El usuario ve claramente dónde se creará el spot antes de confirmar.

---

## Archivos modificados

- `components/explorar/MapScreenVNext.tsx` — lógica previewPinCoords, previewPinLabel
- `components/explorar/MapCoreView.tsx` — recibe y renderiza el pin de preview
