# Bitácora 054 (2026/02) — OL-026: Create spot respeta cámara desde query

**Rama:** `chore/explore-quality-2026-02-09` (mismo PR del día)  
**Objetivo:** Que el mapa del paso 1 de Create Spot inicie con la cámara del usuario (mapLng/mapLat/mapZoom) cuando vienen en la query.

---

## 1) Params soportados

- **Obligatorios para cámara:** `mapLng`, `mapLat`, `mapZoom` (float). Si los tres están presentes y válidos, junto con `lat` y `lng`, se usa `preserveView` y el mapa arranca con ese centro y zoom.
- **Opcionales:** `mapBearing`, `mapPitch` (float). Si vienen y son finitos, se pasan a MapLocationPicker y se aplican en `initialViewState`.
- Long-press en vNext ya envía todos: `mapLng`, `mapLat`, `mapZoom`, y si bearing/pitch ≠ 0 los añade a la query.

---

## 2) Comportamiento (ya implementado)

- **create-spot/index.web.tsx:** `initialParamsRef` parsea `params.mapLng`, `params.mapLat`, `params.mapZoom`, `params.mapBearing`, `params.mapPitch`. Se exponen como `initialViewLongitude`, `initialViewLatitude`, `initialViewZoom`, `initialViewBearing`, `initialViewPitch`. `preserveView` es true cuando hay `lat`, `lng` y los tres de vista (mapLng, mapLat, mapZoom). Cuando `preserveView`, se pasan al MapLocationPicker.
- **MapLocationPicker:** Con `preserveView` usa `initialViewState = { longitude: initialViewLongitude, latitude: initialViewLatitude, zoom: initialViewZoom, bearing?, pitch? }`. Sin params de vista, fallback a centro en lat/lng (zoom 14) o FALLBACK_VIEW.
- **Cambio en este PR:** Solo comentario OL-026 en create-spot; la lógica ya existía.

---

## 3) Pruebas

1. **Logged in:** Abrir `/create-spot?lat=20.5&lng=-87.2&mapLng=-87.2&mapLat=20.5&mapZoom=14`. El mapa debe iniciar con ese centro y zoom; la ubicación sigue prefilled (OL-025).
2. **Sin params:** Abrir `/create-spot`. El mapa sin cambios (centro/usuario o fallback).
3. **E2E long-press:** Long-press en mapa vNext → confirm → Crear spot. La pantalla create-spot debe abrir con la misma cámara aproximada (al menos mismo zoom/centro que en el mapa al soltar).
