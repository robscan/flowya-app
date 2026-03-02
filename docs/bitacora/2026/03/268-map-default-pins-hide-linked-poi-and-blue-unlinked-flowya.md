# 268 — Mapa: ocultar pins default vinculados a POI y unificar default Flowya en azul

Fecha: 2026-03-01  
Tipo: UX runtime + reglas de visibilidad de pines  
Área: Explore map (`MapScreenVNext`, `spots-layer`)

## Contexto

En filtro `Todos`, seguían apareciendo pines `default` de spots derivados de POI tras limpiar estado (`por visitar`/`visitado`), generando ruido visual y ambigüedad sobre qué es realmente contenido propio de Flowya.

## Decisión

- En `Todos`, ocultar spots en estado `default` que estén vinculados a POI (`linked_place_id` presente).
- Mantener visibles solo spots `default` no vinculados (propios de Flowya).
- Unificar color de pin `default` visible a azul en light/dark.

## Implementación

### 1) Regla de visibilidad en runtime

Archivo: `components/explorar/MapScreenVNext.tsx`

- Nueva función:
  - `isDefaultLinkedPoiSpot(spot)` => true cuando `linked_place_id` existe y `saved=false` y `visited=false`.
- En `displayedSpots`:
  - si `pinFilter === "all"`, se filtran spots `default` vinculados.
- Guardrail adicional:
  - evita reinsertar `selectedSpot` si también es `default` vinculado.

### 2) Color default canónico

Archivo: `lib/map-core/spots-layer.ts`

- `pinStatus: default` pasa a `#0A84FF` en light y dark.
- `to_visit` y `visited` sin cambios.

## Resultado esperado

- Filtro `Todos` deja de mostrar ruido de derivados POI sin estado.
- Solo aparecen en `default` los spots Flowya propios no vinculados.
- Lectura visual más clara por color azul único en default.

## Sanidad

- `npm run lint -- --no-cache` OK.
