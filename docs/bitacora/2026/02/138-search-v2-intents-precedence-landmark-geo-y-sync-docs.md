# Bitácora 138 — Search V2: precedencia de intents (`landmark > geo > recommendation`) + sync de docs

**Fecha:** 2026-02-25  
**Rama:** `main`

---

## Objetivo

Corregir desvíos de ranking en queries de monumento (ej. `Torre Eiffel`) y alinear documentación operativa de Search V2 con el comportamiento real implementado.

## Problema detectado

- Queries de monumento estaban cayendo en resultados geográficos genéricos (`Torre`, `TR`, etc.).
- Causa: la intención `geo` podía activarse antes que `landmark`.

## Cambios de implementación

Archivo:

- `lib/places/searchPlacesPOI.ts`

Ajustes:

1. `isGeoIntentQuery` ahora excluye explícitamente queries de `landmark`.
2. Se mantiene la regla de precedencia operativa:
   - `landmark > geo > recommendation`.
3. `landmark` evita sesgo local (usa consulta global) y conserva re-ranking por cobertura de tokens.

## Sync de documentación

Actualizados:

- `docs/definitions/search/SEARCH_V2.md`
- `docs/contracts/SEARCH_V2.md`
- `docs/ops/plans/CHECKLIST_EXECUTION_LINKING_SEARCH_V2.md`
- `docs/ops/OPEN_LOOPS.md`

## Resultado esperado

- `Torre Eiffel` deja de caer en topónimos genéricos y prioriza candidatos de monumento/atracción.
- La documentación refleja explícitamente las intents activas y su precedencia.

## Sanidad

- `npm run lint` ✅
- `npm run build` ✅
