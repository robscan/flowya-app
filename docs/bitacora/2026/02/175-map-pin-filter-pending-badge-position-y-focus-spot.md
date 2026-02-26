# 175 — MapPinFilter: badge pendiente flotante + foco al último spot pendiente por filtro

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Objetivo

Corregir el badge de "pendiente de lectura" en filtros de mapa para que no rompa composición y mejorar la acción de cambio de filtro cuando existe pendiente.

## Cambios aplicados

### 1) Badge pendiente sin desplazar layout

- `MapPinFilter` actualiza posición del badge como overlay (floating), no inline:
  - Trigger `Todos`: badge entre texto y chevron, alineado al borde superior del contenedor de texto.
  - Menú `Por visitar/Visitados`: badge superpuesto en la burbuja del conteo (esquina superior derecha).
- El badge usa color de notificación (`stateToVisit`) y borde de separación para mantener legibilidad sobre fondos claros/oscuros.

Archivo:
- `components/design-system/map-pin-filter.tsx`

### 2) Tap en filtro con pendiente abre el último spot actualizado

- Al cambiar estado de pin desde spot sheet (`to_visit` / `visited`), se registra el último `spotId` por filtro destino.
- Si usuario entra a `Por visitar` o `Visitados` y el badge pendiente corresponde a ese filtro:
  - Se selecciona ese spot.
  - Se abre `SpotSheet` en `medium`.
  - Se centra mapa en el spot (si hay `mapInstance`).
- Si el spot ya no pertenece al filtro o el conteo del filtro queda en `0`, se limpia pendiente y no se fuerza navegación.

Archivo:
- `components/explorar/MapScreenVNext.tsx`

## Guardrails

- Cambio quirúrgico: sin refactor de Search V2 ni del motor de ranking.
- Se conserva el comportamiento previo de reencuadre cuando no aplica caso de pendiente.
- Limpieza defensiva del estado pendiente para evitar "badges fantasma".

## Validación mínima

- Lint OK:
  - `components/design-system/map-pin-filter.tsx`
  - `components/explorar/MapScreenVNext.tsx`
