# 306 — Feedback UX, eliminación clustering, persistencia geolocalización

Fecha: 2026-03-10  
Tipo: UX + limpieza técnica  
Rama: `feat/feedback-ux-clustering-geoloc-persist`

## Contexto

Implementación del plan de feedback de apertura (distancia sin ubicación, etiqueta N resultados) + eliminación definitiva de clustering + mejora: ubicación persiste entre sesiones cuando permiso ya concedido.

## Cambios

### 1. Eliminación de clustering (lib/map-core)

- **constants.ts:** eliminadas `CLUSTER_ENABLED`, `CLUSTER_RADIUS`, `CLUSTER_MAX_ZOOM`.
- **spots-layer.ts:** fuente `SOURCE_ID` siempre `cluster: false`; eliminadas capas `flowya-spots-clusters` y `flowya-spots-clusters-count`; eliminados handlers de click/mouseenter/mouseleave de clusters.

### 2. Distancia: no mostrar sin ubicación compartida

- **MapScreenVNext.tsx:** en `renderItem` de Search, calcular y pasar `distanceText` solo cuando `userCoords != null`; si null, pasar `distanceText={null}` a SearchResultCard y ResultRow.
- SpotSheet y spot/[id] ya correctos (no modificados).

### 3. Etiqueta "N resultados de «query»" en Search

- **types.ts:** añadido `resultsSummaryLabel?: string`.
- **SearchSurface.tsx:** muestra cabecera `resultsSummaryLabel` encima del listado cuando hay resultados.
- **SearchOverlayWeb.tsx, SearchFloatingNative.tsx:** pasan `resultsSummaryLabel`.
- **MapScreenVNext.tsx:** calcula `resultsSummaryLabel` cuando query ≥3 y hay resultados: `"N resultados de «query»"`.

### 4. Ubicación persiste entre sesiones

- **hooks/useMapCore.ts:** useEffect al montar llama `getGeolocationPermissionState()`; si `granted`, llama `requestCurrentLocation()` (sin prompt) y actualiza `userCoords`.
- **app/spot/[id].web.tsx:** misma lógica en SpotDetailContent; si permiso ya concedido, obtiene coords al cargar y muestra distancia sin tocar "Centrar en mi ubicación".

## Archivos modificados

- lib/map-core/constants.ts
- lib/map-core/spots-layer.ts
- components/explorar/MapScreenVNext.tsx
- components/search/types.ts
- components/search/SearchSurface.tsx
- components/search/SearchOverlayWeb.tsx
- components/search/SearchFloatingNative.tsx
- hooks/useMapCore.ts
- app/spot/[id].web.tsx

## Validación mínima

- Mapa sin clusters; pins individuales visibles.
- Sin ubicación: no se muestra distancia en cards ni SpotSheet expanded.
- Con ubicación: distancias correctas; etiqueta "N resultados de «query»" en Search.
- Permiso concedido en sesión anterior: coords disponibles al cargar sin prompt.

## Referencias

- Plan: `.cursor/plans/eliminar_clustering_y_feedback_ux_1ab2ad5e.plan.md`
- Bitácora 286: geolocalización on-demand
- Bitácora 305: pins por visitar/visitados
