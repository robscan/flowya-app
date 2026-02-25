# Bitácora 134 — Search V2 Track B Fase A-B (flags + adapter POI)

**Fecha:** 2026-02-25  
**Rama:** `main` (ejecución inmediata de plan)

---

## Objetivo

Ejecutar Fase A-B de `PLAN_SEARCH_V2_POI_FIRST_SAFE_MIGRATION` sin romper flujo actual:

- habilitar flags de migración,
- introducir adapter externo `searchPlacesPOI`,
- conectar el adapter en no-results detrás de flag.

## Cambios aplicados

Archivos:

- `lib/feature-flags.ts`
- `lib/places/searchPlacesPOI.ts` (nuevo)
- `components/explorar/MapScreenVNext.tsx`
- `docs/contracts/SEARCH_V2.md`
- `docs/definitions/search/SEARCH_V2.md`
- `docs/ops/plans/CHECKLIST_EXECUTION_LINKING_SEARCH_V2.md`

### 1) Flags de migración Search V2

Se agregaron:

- `EXPO_PUBLIC_FF_SEARCH_EXTERNAL_POI_RESULTS`
- `EXPO_PUBLIC_FF_SEARCH_MIXED_RANKING`
- `EXPO_PUBLIC_FF_SEARCH_EXTERNAL_DEDUPE`

### 2) Adapter externo POI-first

- Nuevo módulo `searchPlacesPOI` con contrato común `PlaceResultV2`:
  - `id`, `name`, `fullName`, `lat`, `lng`,
  - `maki`, `featureType`, `categories`,
  - `source`.
- Fase B segura: fallback estable a Geocoding v6.
- Incluye conversión `PlaceResultV2 -> PlaceResult` para mantener UI actual.

### 3) Integración detrás de flag

En no-results de Explore:

- si `EXPO_PUBLIC_FF_SEARCH_EXTERNAL_POI_RESULTS=true`, usa `searchPlacesPOI`,
- si no, mantiene `searchPlaces` legacy.
- dedupe opcional por `EXPO_PUBLIC_FF_SEARCH_EXTERNAL_DEDUPE`.

## Resultado

- Search actual no se rompe (compatibilidad mantenida).
- Queda preparado el paso siguiente (Fase C): ranking mixto por secciones con `ff_search_mixed_ranking`.
