# 250 — Fix: salto inicial de MapControls por fallback de altura

Fecha: 2026-03-01
Tipo: bugfix UX/layout

## Síntoma

En primer render, los controles del mapa aparecían en una posición y luego se desplazaban, generando percepción de "salto".

## Causa

`MAP_CONTROLS_FALLBACK_HEIGHT` estaba sobreestimado (`148`).
Al llegar el `onLayout` real (~100), se recalculaba la columna centrada y se veía movimiento.

## Fix

Archivo: `components/explorar/MapScreenVNext.tsx`

- Ajuste de constante:
  - `MAP_CONTROLS_FALLBACK_HEIGHT: 148 -> 100`
- Se documenta la intención del fallback: aproximar alto real de `2 IconButton + gap`.

## Resultado

Los controles nacen en posición consistente desde el primer frame, eliminando el desplazamiento inicial visible.

## Sanidad

- `npm run lint -- --no-cache` OK.
