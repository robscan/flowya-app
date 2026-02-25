# Bitácora 108 — Integración POI/Spots con SymbolLayer

**Fecha:** 2026-02-14  
**Plan:** docs/_archive/ops/2026/02/PLAN_POI_SPOTS_INTEGRACION.md

## Cambios

### 1. SymbolLayer para spots
- Spots se dibujan como capa nativa Mapbox (circle + symbol) en lugar de Markers DOM
- Capa insertada debajo de POI para evitar superposición visual
- Archivo: `lib/map-core/spots-layer.ts`

### 2. useMapCore
- Nuevas opciones: `spots`, `selectedSpotId`, `onPinClick`
- setupSpotsLayer en useEffect; updateSpotsLayerData cuando cambian spots/zoom

### 3. MapCoreView
- Eliminados Markers de spots; se mantienen Markers para userCoords y previewPin

### 4. POISheetMedium
- Nueva sheet para POI no agregado: título, Compartir, Por visitar, Cerrar
- Compartir y Por visitar crean el spot automáticamente

### 5. Tap unificado
- handleMapClick: si POI tiene spot cercano (≤25 m) → SpotSheet; si no → POISheetMedium
- SPOT_POI_MATCH_TOLERANCE_KM = 0.025

### 6. Deprecados eliminados
- Marker+MapPinSpot para spots
- Modal POI anterior y estilos poiSheet*

## Archivos modificados

- `lib/map-core/constants.ts` — SPOT_POI_MATCH_TOLERANCE_KM, getPoiLayerBeforeId, MAPBOX_LABEL_STYLE_*
- `lib/map-core/spots-layer.ts` — Nuevo
- `hooks/useMapCore.ts` — spots, onPinClick, setupSpotsLayer
- `components/explorar/MapCoreView.tsx` — sin Markers para spots
- `components/explorar/POISheetMedium.tsx` — Nuevo
- `components/explorar/MapScreenVNext.tsx` — POISheetMedium, tap unificado, handleCreateSpotFromPoiAndShare
- `docs/ops/governance/GUARDRAILS_DEPRECACION.md` — registro deprecados
- `docs/_archive/ops/2026/02/PLAN_POI_SPOTS_INTEGRACION.md` — Plan archivado (implementado)
