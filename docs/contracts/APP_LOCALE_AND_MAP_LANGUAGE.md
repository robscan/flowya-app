# APP_LOCALE_AND_MAP_LANGUAGE — Idioma de UI, mapa y geocoding

**Última actualización:** 2026-04-12  
**Estado:** ACTIVE  
**Código:** `lib/i18n/locale-config.ts`, `components/explorar/MapCoreView.tsx` (`mapLanguage`), `MapScreenVNext`, `lib/mapbox-geocoding.ts`, `lib/places/searchPlaces.ts`, `lib/places/searchPlacesPOI.ts`

---

## 1. Estado actual (2026-04)

- **Un solo punto de lectura:** `getCurrentLocale()` / `getCurrentLanguage()` en `locale-config.ts`.
- **Modo fijo manual:** `APP_LOCALE_MODE = "manual"` con `APP_MANUAL_LOCALE = "es-MX"` (DEV/QA). Comentario en código: *futuro conmutar a idioma del sistema sin tocar call sites*.
- **Mapa Mapbox:** `MapScreenVNext` pasa `mapLanguage={getCurrentLanguage() === "es" ? "es" : "en"}` a `MapCoreView` → prop `language` en el estilo del mapa (etiquetas de calles/lugares según Mapbox).
- **APIs Mapbox (geocoding, búsqueda):** ya usan `getCurrentLanguage()` para el parámetro `language` (ver `mapbox-geocoding.ts`, `searchPlaces.ts`, `searchPlacesPOI.ts`).

**Consecuencia:** En cuanto el locale efectivo pase a `en`, **mapa y APIs alinean** sin cambios adicionales en esos call sites, siempre que **`getCurrentLanguage()` derive del mismo origen** que la UI traducida.

---

## 2. Objetivo (i18n completo)

1. **Fuente única de verdad** para “idioma de la app”: preferencia de usuario (perfil/`user_settings`) y/o idioma del sistema, **no** constantes dispersas.
2. **Mapa:** mismas reglas que la UI — sin switch manual duplicado en `MapScreenVNext`; basta con que `getCurrentLanguage()` refleje la preferencia.
3. **Design System (`/design-system` web):** puede **forzar preview** (es/en) para validar componentes canónicos **sin** cambiar preferencia global del usuario; idealmente un **conmutador de preview** que solo afecta al árbol de la vitrina (contexto React) o query `?lang=`.

---

## 3. Ajustes recomendados (cuando se active `OL-I18N-EN-001`)

| Tarea | Nota |
|-------|------|
| Sustituir `APP_LOCALE_MODE === "manual"` fijo | Por resolución: `user preference` → `system` → fallback `es`. |
| Persistencia | `AsyncStorage` / Supabase según `OL-PROFILE-001`. |
| DS vitrina | Switch “UI ES / UI EN (preview)” que alimente un `LocalePreviewProvider` o override local; documentar que no es la preferencia real hasta “Aplicar” si se desea. |
| QA | Lista de pantallas en [PLAN_EXECUTION_POST_WR001](../../ops/plans/PLAN_EXECUTION_POST_WR001_2026-04-12.md) + mapa en ambos idiomas. |

---

## 4. Referencias OL

- **OL-EXPLORE-LOCALE-CONSISTENCY-001** (cerrado): nombres de lugar / features según locale — sigue siendo válido sobre `getCurrentLanguage()`.
