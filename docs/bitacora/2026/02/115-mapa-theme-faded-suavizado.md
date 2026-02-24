# Bitácora 115 — Mapa theme faded (suavizado)

**Fecha:** 2026-02-22

## Objetivo

Reducir el alto contraste del mapa Mapbox Standard en zonas densas (calles, edificios) usando el theme `faded`, para un aspecto más suavizado sin afectar POIs ni funcionalidad.

## Cambios

### 1. Constante centralizada

- **Archivo:** [lib/map-core/constants.ts](../lib/map-core/constants.ts)
- Nueva constante `MAP_BASEMAP_THEME: "default" | "faded" = "faded"`.
- Rollback: cambiar a `"default"` para volver al alto contraste.

### 2. Uso en MapScreenVNext

- **Archivo:** [components/explorar/MapScreenVNext.tsx](../components/explorar/MapScreenVNext.tsx)
- `mapConfig.basemap` extiende con `theme: MAP_BASEMAP_THEME` cuando no es `"default"`.

### 3. Referencia Mapbox

- Mapbox Standard API: `theme` soporta `default`, `faded`, `monochrome`, `custom`.
- `faded` reduce contraste del basemap; recomendado por Mapbox para overlays y datos custom.

## Verificación

- Cargar Explore: mapa se ve más suavizado.
- Tap en POIs sigue funcionando.
- Toggle 3D sin cambios.
