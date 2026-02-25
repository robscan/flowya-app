# 163 — Search reorder por viewport: fix en capa de render (`viewportNonce`)

Fecha: 2026-02-25

## Contexto

Se confirmó que placeholder y otros ajustes sí aplicaban, pero el reorden por viewport en `Por visitar/Visitados` no se reflejaba visualmente.

## Causa

El orden final se calculaba en `searchDisplayResults`, pero ese memo no se recalculaba al mover mapa porque no dependía del tick de viewport.

## Implementación

Archivo:

- `components/explorar/MapScreenVNext.tsx`

Cambio:

1. `searchDisplayResults` ahora recalcula con `viewportNonce`.
2. `searchResultSections` también recalcula con `viewportNonce`.
3. Sin agregar geocoding extra; el orden usa centro de viewport ya disponible en Mapbox.

## Validación mínima

- `npm run lint` OK.

