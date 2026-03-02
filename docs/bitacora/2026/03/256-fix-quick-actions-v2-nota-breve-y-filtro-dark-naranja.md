# 256 — Fix: Quick actions v2 (imagen + nota breve) y filtro dark naranjoso

Fecha: 2026-03-01
Tipo: bugfix UX/web + ajuste visual DS

## Cambios

- `components/explorar/MapScreenVNext.tsx`
  - Quick add image: fallback robusto en web para leer `asset.file` (Blob) y, si no existe, usar `asset.uri` + `fetch`.
  - Se elimina condición rígida que exigía `uri` para continuar.
  - Placeholder de editor rápido actualizado a enfoque diario personal breve.
  - Microcopy de quick action de descripción actualizado (`Escribir nota breve`).

- `components/design-system/search-list-card.tsx`
  - Hardening de interacción: `onStartShouldSetResponderCapture` ahora captura explícitamente (`true`) para quick actions y evita navegación padre accidental.
  - Copy de CTA actualizado a `Escribe una nota personal breve.`

- `components/design-system/map-pin-filter-inline.tsx`
- `components/design-system/map-pin-filter.tsx`
  - En dark mode, estado seleccionado `Por visitar` ahora usa `stateToVisit` (naranja visible).
  - En dark mode, `Visitados` usa `stateSuccess` (verde visible).

## Resultado esperado

- `Agregar imagen` en quick action ya no cae en error genérico por lectura de asset en web.
- `Agregar descripción corta` mantiene estabilidad en taps consecutivos al aislar mejor la interacción.
- Filtro `Por visitar` en dark se percibe claramente naranjoso en buscador y mapa.

## Sanidad

- `npm run lint -- --no-cache` OK.
