# 297 — OL-EXPLORE-LOCALE-CONSISTENCY-001: unificar idioma mapa, buscador y dirección

**Fecha:** 2026-03-07  
**Tipo:** Implementación

## Objetivo

Consistencia de idioma entre mapa, nombre seleccionado y dirección (política canónica de locale + fallback).

## Cambios aplicados

1. **lib/mapbox-geocoding.ts**
   - `resolveAddress` (reverse geocoding): añadido parámetro `language` desde `getCurrentLanguage()`.
   - `resolvePlaceForCreate` (forward geocoding): añadido parámetro `language` desde `getCurrentLanguage()`.

2. **lib/places/searchPlaces.ts**
   - `searchPlaces`: añadido parámetro `language` en request a Geocoding v6.

3. **lib/places/searchPlacesPOI.ts**
   - Search Box forward: reemplazado `language: 'es,en'` hardcoded por `language: \`${getCurrentLanguage()},en\``.

4. **hooks/useMapCore.ts**
   - Re-activado `MapboxLanguage` con `defaultLanguage: getCurrentLanguage()` en onMapLoad.
   - Envolto en try/catch para no bloquear carga si el estilo custom no soporta el plugin.

## Fuente única

Todas las llamadas usan `lib/i18n/locale-config.ts`: `getCurrentLanguage()` y `getCurrentLocale()`.

## Validación mínima

- `npm run lint` — OK.
- QA manual: cambiar `APP_MANUAL_LOCALE` en locale-config y verificar que búsqueda, direcciones y labels del mapa reflejen el idioma.

## Rollback

Revertir cambios en los 4 archivos. No hay migraciones.
