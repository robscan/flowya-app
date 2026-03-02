# 251 — Map controls: orden thumb-first + mayor gap con contadores

Fecha: 2026-03-01
Tipo: ajuste UX de accesibilidad táctil

## Objetivo

- Mejorar alcance con pulgar en columna derecha del mapa.
- Separar mejor el grupo de contadores del grupo de controles.
- Reordenar controles para priorizar "mi ubicación" arriba y "mundo/reencuadre" abajo.

## Cambios

Archivos:
- `components/explorar/MapScreenVNext.tsx`
- `components/design-system/map-controls.tsx`

Aplicado:
- Gap entre grupos (`COUNTRIES_AND_CONTROLS_GAP`): `12 -> 20`.
- Orden en `MapControls`:
  - primero `Locate` (mi ubicación),
  - después `World` o `Reframe` según contexto.

## Resultado

Interacciones de mapa más ergonómicas para uso con una mano y menor choque visual entre grupos.

## Sanidad

- `npm run lint -- --no-cache` OK.
