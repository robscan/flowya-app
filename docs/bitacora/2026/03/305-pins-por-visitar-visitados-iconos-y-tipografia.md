# 305 — Pins por visitar/visitados: iconos Pin/CheckCircle, tipografía clusters/chips, clustering por estado

**Fecha:** 2026-03-10  
**Tipo:** UX / visual  
**Estado:** Completado

## Problema

1. Spots por visitar/visitados usaban iconos Maki (categoría) en lugar de los iconos de filtro (Pin y CheckCircle).
2. Traslape: círculos (chips) e iconos en capas separadas; al juntarse dos pins, los iconos se superponían sin que el fondo acompañara.
3. Tipografía clusters (dark) y chips filtro (light): contraste insuficiente.
4. Clusters incluían spots sin estado (default); debían agrupar solo por visitar/visitados.

## Solución implementada

### 1. Iconos Pin y CheckCircle (mismo que filtros)

- **`lib/map-core/pin-status-images.ts`** (nuevo): imágenes compuestas (círculo + icono) como unidad.
  - **Por visitar:** Lucide Pin (path oficial de lucide-react-native).
  - **Visitados:** palomita (check), sin círculo redundante.
- Registro en `style-image-fallback.ts` (preload + styleimagemissing).

### 2. Capa única para por visitar/visitados (resuelve traslape)

- **`lib/map-core/spots-layer.ts`**:
  - Nueva capa `PINS_SAVED_VISITED_LAYER_ID`: símbolos con imágenes compuestas.
  - Eliminada `CIRCLES_SAVED_VISITED` (círculos separados).
  - Eliminada `MAKIS_LAYER` para saved/visited.
  - Maki solo en spots default con POI (`MAKIS_DEFAULT_LAYER`).
- Chip + icono en una sola capa → traslape resuelto.

### 3. Tipografía

- **`constants/theme.ts`:** `cluster.textColor`: light `#ffffff`, dark `#1d1d1f`.
- **`lib/map-core/spots-layer.ts`:** clusters usan `clusterStyle.textColor`.
- **`map-pin-filter-inline.tsx`**, **`search-list-card.tsx`:** chips por visitar/visitados en light con texto negro `#1d1d1f` para contraste.

### 4. Clusters solo con spots con estado

- Fuentes separadas: `flowya-spots` (to_visit + visited, clusterable) y `flowya-spots-default` (default, sin cluster).
- Spots default no entran en clusters; solo por visitar y visitados se agrupan.

### 5. Clustering desactivable

- **`lib/map-core/constants.ts`:** `CLUSTER_ENABLED = false` para pruebas.

## Archivos modificados

- `lib/map-core/pin-status-images.ts` (nuevo)
- `lib/map-core/spots-layer.ts`
- `lib/map-core/style-image-fallback.ts`
- `lib/map-core/constants.ts`
- `constants/theme.ts`
- `components/design-system/map-pin-filter-inline.tsx`
- `components/design-system/search-list-card.tsx`

## Referencias

- Bitácora 302: iconos Maki en listas
- Bitácora 303: clustering Mapbox
- Plan: Ajustes iconos y traslape pins (2026-03-10)
