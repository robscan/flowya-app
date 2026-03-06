# 290 — Search: encuadre completo para país/región al seleccionar resultado

Fecha: 2026-03-06
Tipo: Fix transversal UX (sin loop nuevo)

## Contexto
En búsqueda, al tocar un país (ej. México), el mapa hacía `flyTo` a un punto con zoom de spot. Eso podía mostrar una vista poco útil para entidades geográficas amplias.

## Cambios aplicados
- Se propagó `bbox` en resultados de lugares:
  - `lib/places/searchPlaces.ts`
  - `lib/places/searchPlacesPOI.ts`
- En Explore (`components/explorar/MapScreenVNext.tsx`):
  - al seleccionar `country/region`, se intenta `fitBounds` con `bbox`
  - fallback seguro: `flyTo` con zoom amplio geográfico
  - para POIs/lugares puntuales se mantiene flujo existente

## Evidencia (archivos)
- `components/explorar/MapScreenVNext.tsx`
- `lib/places/searchPlaces.ts`
- `lib/places/searchPlacesPOI.ts`

## Validación mínima
- `npm run lint -- --no-cache components/explorar/MapScreenVNext.tsx lib/places/searchPlaces.ts lib/places/searchPlacesPOI.ts`
- Resultado: OK

## Rollback
Revertir los tres archivos anteriores para regresar al `flyTo` puntual para cualquier selección.
