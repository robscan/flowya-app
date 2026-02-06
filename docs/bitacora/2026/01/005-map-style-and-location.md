# Bitácora: Estilo minimal y ubicación inicial

## Paso: Base map minimal + centro en usuario

**Fecha:** 2025-02-01

### Objetivo

Mejorar la base del mapa: estilo claro y minimal adecuado para overlays, menos ruido visual, y vista inicial centrada en el usuario cuando el permiso de ubicación lo permite.

### Decisión de estilo: minimal y sin POIs comerciales

- **Estilo base:** `mapbox://styles/mapbox/light-v11`.  
  Se eligió un estilo **light** y minimal para que los overlays (marcadores, futuras cards) destaquen sin competir con un mapa muy cargado.

- **Por qué minimal:**  
  Un mapa con menos detalle reduce ruido visual y hace que los spots del usuario sean el foco. Light-v11 mantiene calles, barrios y elementos de referencia sin saturar.

- **Por qué ocultar POIs comerciales:**  
  Se oculta la capa **poi-label** (puntos de interés, tiendas, restaurantes, negocios) para:
  - Evitar que etiquetas de comercios compitan con los spots de Flowya.
  - Mantener legible el mapa (calles, barrios, edificios públicos, parques, agua).  
  En el estilo estándar de Mapbox, poi-label agrupa muchos tipos de POI; ocultarla quita ruido comercial. Si en el futuro se necesita distinguir solo “comercial” vs “público”, haría falta un estilo custom en Mapbox Studio.

- **Qué se mantiene visible:**  
  Nombres de calles, barrios (place-label), edificios públicos, parques y elementos naturales, y masas de agua. No se tocaron otras capas.

### Comportamiento de ubicación inicial y fallback

- **Al cargar el mapa:**  
  1. Se pide la ubicación del usuario con la API de geolocalización del navegador (`navigator.geolocation.getCurrentPosition`).  
  2. Sin alertas bloqueantes: el navegador muestra su propio diálogo de permiso.  
  3. Si el usuario **acepta:** el mapa hace `flyTo` al punto actual (zoom 14) tras cargar.  
  4. Si el usuario **deniega**, hay timeout o no hay soporte: no se hace nada; el mapa se queda en la vista de fallback.

- **Fallback cuando no hay ubicación:**  
  Se usa una vista por defecto centrada en **Riviera Maya** (longitude: -87.2, latitude: 20.4, zoom: 10). Es una región neutra y reconocible; en el futuro podría sustituirse por “última ubicación conocida” o preferencia del usuario.

- **Opciones de la petición:**  
  `enableHighAccuracy: true`, `timeout: 10000`, `maximumAge: 300000` (5 min) para equilibrar precisión y no bloquear si la ubicación tarda.

### Cambios realizados

- Estilo del mapa: `streets-v12` → `light-v11`.
- `initialViewState`: valor por defecto → `FALLBACK_VIEW` (Riviera Maya).
- En `onLoad`: ocultar capa `poi-label` y llamar a geolocalización; si hay posición, `flyTo` al usuario.
- Sin cambios en lógica de marcadores ni consultas a Supabase.

### Archivos tocados

- **Modificados:** `app/(tabs)/index.web.tsx`.
- **Creados:** `docs/bitacora/2026/01/005-map-style-and-location.md`.
