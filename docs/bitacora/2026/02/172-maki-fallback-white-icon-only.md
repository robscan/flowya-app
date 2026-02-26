# 172 — Fallback maki final: ícono blanco solamente

Fecha: 2026-02-25

## Contexto

Se definió preferencia visual final:

- no usar color en fallback
- mostrar solo ícono blanco
- aprovechar color de fondo del pin según estado/filtro.

## Implementación

Archivo:

- `lib/map-core/style-image-fallback.ts`

Cambio:

1. Se elimina paleta de color del fallback.
2. Fallback renderiza solo glifo blanco (forma simple) sobre canvas transparente.
3. El fondo/color lo sigue dando el círculo del pin (`spots-layer` por `pinStatus`).

## Validación mínima

- `npm run lint` OK.

