# 171 — Fallback maki: paleta sin tonos rojos

Fecha: 2026-02-25

## Contexto

Se detectó que una variante de fallback mostraba tono rojizo poco alineado al look de mapa.

## Implementación

Archivo:

- `lib/map-core/style-image-fallback.ts`

Cambio:

- Se ajusta paleta de fallback para remover variantes rojas/magenta.
- Se mantiene diferenciación por hash/forma con tonos azules, teal, naranja y grises, con centro blanco.

## Validación mínima

- `npm run lint` OK.

