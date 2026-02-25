# Bitácora 139 — Search V2 landmark hardening (match exacto + filtro de ruido)

**Fecha:** 2026-02-25  
**Rama:** `main`

---

## Objetivo

Resolver desviación de resultados en queries de monumento (ej. `Torre Eiffel`) donde aparecían variantes comerciales/genéricas por encima del candidato esperado.

## Cambios aplicados

Archivo:

- `lib/places/searchPlacesPOI.ts`

Ajustes de ranking en modo `landmark`:

- boost fuerte a match exacto de nombre,
- priorización por cobertura completa de tokens del query,
- penalización explícita de ruido comercial (`fiestas`, `convenciones`, `replica`, etc.),
- penalización de resultados tipo `address/street` cuando compiten con landmark.

## Sync documental

- `docs/definitions/search/SEARCH_V2.md`
- `docs/contracts/SEARCH_V2.md`

## Resultado esperado

- En queries landmark, el candidato canónico (p. ej. `Torre Eiffel`, París) sube por encima de variantes comerciales/locales.

## Sanidad

- `npm run lint` ✅
- `npm run build` ✅
