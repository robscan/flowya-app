# 177 — MapPinFilter: badges pendientes simultáneos (`Por visitar` + `Visitados`)

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Objetivo

Corregir pérdida de pendiente cuando se generan cambios en ambos filtros desde `Todos` (primero `Por visitar`, luego `Visitados`, o viceversa).

## Cambios aplicados

- `MapScreenVNext` migra de estado monovalor (`pendingFilterBadge`) a estado por filtro:
  - `pendingFilterBadges.saved`
  - `pendingFilterBadges.visited`
- Al mutar estado desde `Todos`, se activa el badge del filtro destino **sin apagar el otro**.
- Limpieza independiente por filtro:
  - se limpia solo al tocar ese filtro,
  - o cuando su `count` llega a `0`.
- Se mantiene la lógica de foco/sheet para pendientes al seleccionar filtro destino.

## Render

- `MapPinFilter` ahora recibe `pendingValues` (objeto) en lugar de `pendingValue` único.
- Trigger `Todos`: muestra badge si existe al menos un pendiente.
- Menú: cada opción (`Por visitar` / `Visitados`) muestra su badge en forma independiente.

## Archivos

- `components/explorar/MapScreenVNext.tsx`
- `components/design-system/map-pin-filter.tsx`

## Validación mínima

- Lint OK en ambos archivos.
