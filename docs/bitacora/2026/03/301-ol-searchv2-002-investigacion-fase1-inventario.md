# 301 — OL-SEARCHV2-002: investigación fase 1 — inventario y métricas

**Fecha:** 2026-03-09  
**Tipo:** Avance investigación

## Objetivo

Avanzar fase 1 de investigación OL-SEARCHV2-002: inventario de superficies API Mapbox, patrones de uso y instrumentación para medir consumo.

## Entregables

1. **Inventario de superficies API** — [docs/ops/investigation/OL_SEARCHV2_002_API_INVENTORY_2026-03-09.md](../../ops/investigation/OL_SEARCHV2_002_API_INVENTORY_2026-03-09.md)
   - Endpoints: reverse, forward (Geocoding v6), Search Box forward, Search Box category
   - Llamadas por flujo (Create Spot, Explore, Edit Spot, MapLocationPicker)
   - searchPlacesByCategory: código presente pero no invocado (nearbyPlacesEmpty = [])

2. **Patrones que generan más llamadas**
   - Búsquedas repetidas, viewport, Create Spot debounce, cold start, Edit Spot, CJK

3. **Instrumentación**
   - `lib/mapbox-api-metrics.ts`: recordMapboxApiCall(endpoint, caller)
   - Integrado en mapbox-geocoding, searchPlaces, searchPlacesPOI, searchPlacesCategory
   - Inspección: `globalThis.__flowyaMapboxApiMetrics` o `getMapboxApiMetricsSnapshot()`
   - Activación debug: `EXPO_PUBLIC_DEBUG_MAPBOX_METRICS=true`

4. **Estimación de coste y umbral**
   - Free tier 100k/mes; tabla de usuarios/sesión
   - Umbral: superar free tier sostenidamente, P99 > 500ms, 429 frecuentes

## Próximo paso

- Ejecutar sesiones de prueba con instrumentación activa
- Registrar consumo real y comparar con umbral
- Informe final con recomendación: optimizar vs no optimizar
