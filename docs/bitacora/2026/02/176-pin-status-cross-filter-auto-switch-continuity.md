# 176 — Continuidad UX al cambiar estado entre filtros (`Por visitar` <-> `Visitados`)

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Objetivo

Evitar pérdida de contexto cuando un spot cambia de estado en un filtro distinto al destino (ej. estando en `Por visitar` y marcando `Visitado`).

## Cambios aplicados

- En `MapScreenVNext`, al mutar estado de pin desde sheet:
  - Si filtro actual es `Todos`: se mantiene comportamiento existente (badge pendiente en filtro destino).
  - Si filtro actual es `saved` o `visited` y el destino es distinto:
    - se cambia automáticamente al filtro destino,
    - se mantiene selección del spot,
    - se abre `SpotSheet` en estado `medium`,
    - se centra cámara en el spot (vía flujo de cambio de filtro).
- Si el destino coincide con el filtro actual, se mantiene animación de confirmación (`pulseNonce`) sin cambiar filtro.

Archivo:
- `components/explorar/MapScreenVNext.tsx`

### Fix web adicional (hydration)

- Se corrige estructura inválida HTML en `MapPinFilter` para web:
  - antes: `Pressable` interno (renderiza `button`) anidado dentro del `Pressable` trigger (`button`).
  - ahora: `X` visual dentro del trigger y área táctil como `Pressable` overlay hermano (no anidado).
- Evita warning/error de hidratación: `<button> cannot be a descendant of <button>`.

Archivo:
- `components/design-system/map-pin-filter.tsx`

## Guardrails

- Sin cambios en Search V2 ni ranking.
- Sin cambios en contratos de pin status.
- Reutiliza función existente `handlePinFilterChange` para evitar paths paralelos.

## Validación mínima

- Lint OK: `components/explorar/MapScreenVNext.tsx`.
