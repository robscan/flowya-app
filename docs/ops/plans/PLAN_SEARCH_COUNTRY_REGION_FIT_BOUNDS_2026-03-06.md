# PLAN — Search: encuadre completo para país/región

**Fecha:** 2026-03-06  
**Tipo:** Fix transversal UX (sin abrir loop nuevo)

## Objetivo
Al seleccionar un resultado geográfico amplio (`country` o `region`) desde el buscador, el mapa debe encuadrar el territorio completo en pantalla, evitando el zoom puntual que hoy se percibe como “mapa vacío”.

## Alcance
- Explore web (`MapScreenVNext`) en selección de resultados de búsqueda de lugares.
- Capa de búsqueda (`searchPlaces`, `searchPlacesPOI`) para propagar `bbox` cuando esté disponible.

## Decisiones
1. Reutilizar `bbox` nativo de Mapbox cuando venga en el resultado.
2. Aplicar `fitBounds` solo para `country/region`.
3. Mantener fallback seguro:
- si no hay `bbox` o falla `fitBounds`, usar `flyTo` al centro con zoom amplio (país/región), no zoom de spot.
4. No cambiar contratos de DB ni backend.

## Diseño técnico
- Extender `PlaceResult` y `PlaceResultV2` con `bbox?: { west, south, east, north }`.
- Parsear/validar bbox en:
- `lib/places/searchPlaces.ts` (Geocoding v6)
- `lib/places/searchPlacesPOI.ts` (Search Box + adapters)
- En `components/explorar/MapScreenVNext.tsx`, en `handleCreateFromPlace`:
- detectar `country/region`
- si hay `bbox`, usar `mapInstance.fitBounds`
- si no, fallback a `flyTo` con zoom amplio

## Criterios de aceptación
1. Seleccionar país/región desde búsqueda encuadra territorio completo cuando existe bbox.
2. Si bbox no existe, el zoom inicial sigue siendo legible para escala geográfica.
3. POIs/direcciones/lugares puntuales mantienen flujo actual.
4. Lint de archivos modificados en verde.

## Rollback
- Revertir cambios en:
- `components/explorar/MapScreenVNext.tsx`
- `lib/places/searchPlaces.ts`
- `lib/places/searchPlacesPOI.ts`
- La app vuelve al comportamiento previo (`flyTo` puntual para toda selección).
