# 169 — Prioridad a ícono maki real antes de fallback

Fecha: 2026-02-25

## Contexto

QA detectó que en mapa se veía solo fallback, sin cargar íconos reales del sprite cuando estaban disponibles.

## Causa

El fallback se inyectaba para ids maki directos (`foo-11/foo-15`) en `styleimagemissing`, lo que podía sombrear intentos alternos del sprite.

## Implementación

Archivos:

- `lib/map-core/spots-layer.ts`
- `lib/map-core/style-image-fallback.ts`

Cambio:

1. `spots-layer` ahora define candidatos de ícono por spot:
   - `makiIconPrimary` (preferencia `-15`)
   - `makiIconAlt` (`-11`)
   - `makiFallbackIcon` (`flowya-fallback-*`)
2. Expresión `icon-image`:
   - intenta `primary` -> `alt` -> `flowya-fallback-*` -> `marker-15`.
3. `style-image-fallback` deja de generar fallback para ids maki directos y solo responde a:
   - `flowya-fallback-*`
   - `marker-15`

## Resultado esperado

- Si el sprite tiene ícono real, se usa ícono real.
- Fallback aparece solo cuando no existe ni `-15` ni `-11`.

## Validación mínima

- `npm run lint` OK.

