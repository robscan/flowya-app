# 298 — OL-EXPLORE-LOCALE-CONSISTENCY-001: cierre — nombre POI + dirección en CJK

**Fecha:** 2026-03-07  
**Tipo:** Cierre

## Objetivo

Resolver nombre del POI y dirección en japonés en regiones CJK (Japón). El sheet debía mostrar el mismo texto que el mapa; la dirección debía localizarse.

## Cambios aplicados

1. **mapLanguage en Map** (`MapCoreView.tsx`, `MapScreenVNext.tsx`)
   - Prop `mapLanguage` (es/en) según `getCurrentLanguage()`, alinea labels del mapa con locale.

2. **getLabelLayerIds fallback** (`lib/map-core/constants.ts`)
   - Si no hay capas `place-label*`/`poi-label*`, usa capas `type=symbol`.

3. **queryRenderedFeatures fallback** (`MapScreenVNext.tsx`)
   - Si el filtro por capas label devuelve 0 features, fallback a query sin filtro (restaura apertura del sheet).

4. **resolveAddress para CJK** (`lib/mapbox-geocoding.ts`)
   - Mapbox v6 reverse no devuelve `context.translations`.
   - Primera llamada: `types=place,region,country` + `language=en` (mejor cobertura en Japón).
   - Toma primer feature cuyo `place_formatted` o `name` estén en script latino.
   - Fallback: llamada sin `types` (comportamiento anterior).

## Evidencia

- Sapporo muestra "Sapporo" en mapa y sheet.
- Dirección en inglés (p. ej. Hiroshima, Hiroshima Prefecture, Japan) en regiones CJK.

## Próximo paso: PR + boots

- Trabajar en rama, abrir PR.
- Esperar resultado de boots (CI) antes de merge.
- Si boots no reporta errores → merge. Si hay errores → corregir primero.
