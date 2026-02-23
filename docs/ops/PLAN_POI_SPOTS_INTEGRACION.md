# Plan: Integración POI/Spots y Deprecación Controlada

**Estado:** Implementado (2026-02-14)

## Objetivos

- Spots como capa nativa Mapbox debajo de POI (sin superposición visual)
- Labels de pines con estilo Mapbox
- Nueva sheet POISheetMedium (Compartir, Por visitar, Cerrar)
- Tap unificado: POI con spot → SpotSheet; POI sin spot → POISheetMedium

## Implementación

| MS | Descripción | Archivos |
|----|-------------|----------|
| MS-1 | SymbolLayer para spots | useMapCore, MapCoreView, spots-layer.ts, constants |
| MS-2 | Estilo labels tipo Mapbox | MAPBOX_LABEL_STYLE_* en constants |
| MS-3 | POISheetMedium | POISheetMedium.tsx, MapScreenVNext |
| MS-4 | Tap unificado (tolerancia ~25m) | handleMapClick, SPOT_POI_MATCH_TOLERANCE_KM |
| MS-5 | Círculos + zoom | circle-radius/data-driven, selected state |

## Deprecados eliminados

- Marker+MapPinSpot para spots en MapCoreView
- Modal POI anterior (estilos poiSheet*)

Ver GUARDRAILS_DEPRECACION.md.
