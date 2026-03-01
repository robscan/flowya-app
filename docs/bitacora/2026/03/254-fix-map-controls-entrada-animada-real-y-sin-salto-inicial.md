# 254 — Fix: MapControls con entrada animada real y sin salto inicial

Fecha: 2026-03-01
Tipo: bugfix UX motion/layout

## Síntoma

- No se percibía animación de entrada en controles de mapa.
- Persistía salto de layout al inicio.

## Causa

- Overlay de controles nacía montado (`mounted=true`) y valor animado inicial en `1`, saltándose la entrada.
- El layout podía reajustarse por medición dinámica de altura en runtime.

## Fix

Archivo: `components/explorar/MapScreenVNext.tsx`

- `mapControlsOverlayMounted` inicial en `false`.
- `mapControlsOverlayEntry` inicial en `0`.
- Se mantiene montaje diferido + animación de entrada/salida.
- Se elimina recalibración por `onLayout` de controles; altura estable vía fallback canónico.

## Resultado

- Entrada animada visible y consistente.
- Sin reposicionamiento inicial perceptible del bloque de controles.

## Sanidad

- `npm run lint -- --no-cache` OK.
