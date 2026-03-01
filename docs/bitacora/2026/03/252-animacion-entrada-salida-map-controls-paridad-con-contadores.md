# 252 — Animación de entrada/salida en MapControls (paridad con contadores)

Fecha: 2026-03-01
Tipo: ajuste UX motion

## Objetivo

Dar a `MapControls` el mismo lenguaje de motion que el overlay de contadores:
- entrada/salida suave,
- fade + desplazamiento horizontal,
- sin cortes abruptos al montar/desmontar.

## Implementación

Archivo: `components/explorar/MapScreenVNext.tsx`

- Se añadió estado de montaje separado para controles:
  - `mapControlsOverlayMounted`.
- Se añadió driver de animación:
  - `mapControlsOverlayEntry` (`Animated.Value` con estados 0/1/2).
- Se añadió delay ref para controlar entrada:
  - `mapControlsOverlayDelayRef`.
- Se incorporó estilo animado (`opacity + translateX`) con misma curva que contadores.
- Render actualizado a `Animated.View` con `pointerEvents` condicionado por visibilidad.

Constante nueva:
- `MAP_CONTROLS_OVERLAY_ENTRY_DELAY_MS = 80`.

## Resultado

Controles de mapa ahora animan entrada y salida en sincronía visual con los contadores, manteniendo reglas de visibilidad existentes.

## Sanidad

- `npm run lint -- --no-cache` OK.
