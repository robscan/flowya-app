# 168 — Fallback maki: visual distinguible por id (color + forma)

Fecha: 2026-02-25

## Contexto

Pendiente `OL-P1-008`: fallback actual de íconos maki ausentes se percibía homogéneo (punto blanco) y degradaba lectura visual.

## Implementación

Archivo:

- `lib/map-core/style-image-fallback.ts`

Cambio:

1. Se mantiene soporte de `styleimagemissing` para `marker-15` y `maki-11/15`.
2. El fallback ya no es único:
   - color exterior variable por hash de `maki id`
   - borde de contraste
   - forma interior variable (`dot`, `square`, `diamond`)
3. `marker-15` conserva fallback neutral canónico.

## Resultado esperado

- Pins con sprites faltantes dejan de verse como símbolo idéntico.
- Se preserva estabilidad runtime (sin errores por imagen faltante).

## Validación mínima

- `npm run lint` OK.

