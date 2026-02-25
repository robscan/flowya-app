# Bitácora 140 — Search V2 landmark global (sin sesgo local) + layout full-height de recomendaciones

**Fecha:** 2026-02-25  
**Rama:** `main`

---

## Objetivo

1. Evitar que la ubicación del usuario distorsione queries landmark (ej. `Torre Eiffel`).
2. Alinear el contenedor de recomendaciones al mismo comportamiento visual/altura que resultados de spots cercanos.

## Cambios aplicados

### A) Landmark sin sesgo local

Archivo: `lib/places/searchPlacesPOI.ts`

- En modo `landmark`, tanto Search Box como fallback geográfico se ejecutan en modo global (`sin bbox/proximity`).
- Para re-ranking se amplía el pool de candidatos antes de cortar al límite final (mejor recall de candidato canónico).

### B) Layout full-height en recomendaciones

Archivos:

- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchFloatingNative.tsx`

- Se elimina el área filler inferior (`tapToCloseMapArea`) en estado no-results para que el listado ocupe alto completo como en "Spots cercanos".
- Se mantiene comportamiento de teclado: scroll web/nativo sigue ocultándolo.

## Sync documental

- `docs/definitions/search/SEARCH_V2.md`
- `docs/contracts/SEARCH_V2.md`

## Sanidad

- `npm run lint` ✅
- `npm run build` ✅
