# 170 — Maki: evitar warnings de imagen faltante resolviendo con `map.listImages()`

Fecha: 2026-02-25

## Contexto

QA reportó warning runtime:

- `Image "beach-15" could not be loaded... styleimagemissing`

Esto indicaba intento de render con id no presente en sprite.

## Implementación

Archivo:

- `lib/map-core/spots-layer.ts`

Cambio:

1. Antes de construir GeoJSON se consulta `map.listImages()`.
2. Por spot, se resuelve `makiIcon` final:
   - usa `-15` si existe
   - si no, usa `-11` si existe
   - si no, usa `flowya-fallback-*`
3. `icon-image` ahora usa id ya resuelto (`makiIcon`), evitando referencias directas a ids faltantes.

## Resultado esperado

- Se eliminan warnings por ids maki inexistentes en render path normal.
- Se mantienen íconos reales cuando están disponibles y fallback cuando no.

## Validación mínima

- `npm run lint` OK.

