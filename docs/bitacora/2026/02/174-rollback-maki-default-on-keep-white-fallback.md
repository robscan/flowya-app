# 174 — Rollback: `flowyaPinMakiIcon` default ON, mantener fallback blanco

Fecha: 2026-02-25

## Contexto

Se pidió mantener la propuesta visual acordada:

- ícono fallback blanco
- fondo del pin por estado/filtro

Sin desactivar iconografía maki por defecto.

## Implementación

Archivo:

- `lib/feature-flags.ts`

Cambio:

- `flowyaPinMakiIcon` vuelve a default `true`.
- Se conserva fallback blanco en `style-image-fallback.ts`.

## Validación mínima

- `npm run lint` OK.

