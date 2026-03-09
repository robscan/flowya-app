# 297 — OL-EXPLORE-LOCALE-CONSISTENCY-001: unificar idioma mapa, buscador y dirección

**Fecha:** 2026-03-07  
**Tipo:** Implementación

## Objetivo

Consistencia de idioma entre mapa, nombre seleccionado y dirección (política canónica de locale + fallback).

## Cambios aplicados

1. **lib/mapbox-geocoding.ts**
   - `resolveAddress`, `resolvePlaceForCreate`: parámetro `language` con fallback `es,en`.

2. **lib/places/searchPlaces.ts**
   - `searchPlaces`: `language` con fallback `${lang},en` para evitar nombres locales en regiones sin traducción.

3. **lib/explore/map-screen-orchestration.ts**
   - `getTappedFeatureNameByLocale`: elige `name_es`, `name_en`, `name` según locale.
   - `getDisplayNameForPlace`: helper para PlaceResult con `name_es`/`name_en` opcionales.

4. **lib/search/emptyRecommendations.ts**
   - `pickName`: usa `getTappedFeatureNameByLocale` para landmarks visibles (lista de búsqueda).
   - `collectVisibleLandmarks`: añade `name_es`, `name_en` a PlaceResult cuando existen en tiles.

5. **lib/places/searchPlaces.ts** (PlaceResult)
   - Tipos opcionales `name_es`, `name_en` para soporte multiidioma.

6. **components/explorar/MapScreenVNext.tsx**
   - Popup POI y setPoiTapped: usan `getTappedFeatureNameByLocale` / `getDisplayNameForPlace`.
   - `handleCreateFromNoResults`: usa `getDisplayNameForPlace(targetPlace)` para nombre del sheet.
   - `handleMapClick`: prioriza la feature con `name_es` o `name_en` (igual que etiquetas del mapa) para que el sheet muestre el mismo nombre que se ve en el mapa.

## Fuente única

Todas las llamadas usan `lib/i18n/locale-config.ts`: `getCurrentLanguage()` y `getCurrentLocale()`.

## Validación mínima

- `npm run lint` — OK.
- QA manual: cambiar `APP_MANUAL_LOCALE` en locale-config y verificar que búsqueda, direcciones y labels del mapa reflejen el idioma.

## Documento de arquitectura

Ver: `docs/ops/analysis/OL_EXPLORE_LOCALE_ARCHITECTURE.md` (flujo, fuente de verdad, estrategia unificada, limitaciones).

## Rollback

Revertir cambios en: `lib/mapbox-geocoding.ts`, `lib/places/searchPlaces.ts`, `lib/explore/map-screen-orchestration.ts`, `lib/search/emptyRecommendations.ts`, `components/explorar/MapScreenVNext.tsx`. No hay migraciones.
