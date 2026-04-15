# 359 — Explore Lugares: persistencia filtros (país + etiquetas), precedencia mapa vs ruta sheet, fin del reset silencioso en KPI, hidratación por sesión, a11y web, orden chips

**Fecha:** 2026-04-14  
**Rama:** `feat/places-sheet-lugares-header` (cierre documentado con el merge previsto a `main`).

## Objetivo

Que la **selección de país y etiquetas** en el flujo **Por visitar / Visitados** sea **coherente** entre mapa, sheet Lugares, buscador y modal de filtros; que **no se pierda** al cerrar/reabrir el sheet ni al recargar (misma cuenta); y eliminar **comportamiento legacy** que reseteaba el filtro de país sin intención del usuario. Completar con **accesibilidad en web** (sin props RN en el DOM) y **orden de chips** que evite que el país quede fuera del scroll horizontal.

## Resumen de decisiones

1. **Dos estados explícitos** (ya documentados en comentarios en código):
   - `explorePlacesCountryFilter` — **alcance de filtro** compartido por mapa, chips, modal y persistencia.
   - `countriesSheetListView` — **ruta UI** del sheet (KPI vs listado «todos los lugares» vs drill país).
2. **Precedencia para datos y chips:** `placesScopeForData = explorePlacesCountryFilter ?? countriesSheetListView` (el mapa/filtro manda sobre la ruta UI; evita que `all_places` en la ruta oculte el chip de país).
3. **KPI «Lugares» / pastilla lugares:** solo actualiza la **ruta** del sheet a listado; **no** vuelve a poner `explorePlacesCountryFilter` en `all_places` (eso era el reset tipo UX antigua «entrar al listado = quitar país»).
4. **Persistencia local** por usuario (`AsyncStorage` / `localStorage`): `lib/storage/explorePlacesFiltersPreference.ts` — snapshot versionado `{ tagIds, country }`; hidratación tras catálogo de etiquetas; persistencia debounced tras hidratar (nativo no escribe antes de leer).
5. **Sesión:** si cambia el `user.id` sin pasar por estado anónimo intermedio, se invalida la ref de hidratación para volver a cargar el storage del usuario nuevo.
6. **Prune de etiquetas:** no recortar contra pool vacío hasta `userTagsCatalogReady` (evita carrera con hidratación).
7. **Web:** `accessibilityElementsHidden` no se pasa a iconos Lucide / vistas decorativas; en web `aria-hidden` donde aplica; cuenta web: `aria-hidden` en `View` espaciador (sin props RN inválidas en DOM).

## Cambios técnicos (archivos principales)

| Área | Archivo(s) |
|------|------------|
| Persistencia | `lib/storage/explorePlacesFiltersPreference.ts` (nuevo) |
| Orquestación Explore | `components/explorar/MapScreenVNext.tsx` — `placesScopeForData`, hidratación web/native, persist debounced, `applySession` + ref hidratación, prune, logout, `handleCountriesSpotsKpiPress`, integración modal/búsqueda/sheet |
| Barra chips | `components/explorar/explore-places-active-filters-bar.tsx` — orden país → etiquetas; Globe y a11y web |
| Modal filtros | `components/explorar/explore-places-filters-modal.tsx` |
| País en DS | `components/design-system/explore-country-filter-chip-row.tsx` (nuevo), `constants/theme.ts` (tokens si aplica) |
| Etiquetas DS | `components/design-system/explore-tag-filter-chip-row.tsx`, `explore-tag-icon-label.tsx`, `tag-chip.tsx` |
| Iconos decorativos | `components/design-system/clear-icon-circle.tsx` |
| Búsqueda / slot filtros | `components/search/SearchSurface.tsx`, `SearchOverlayWeb.tsx`, `SearchFloatingNative.tsx`, `types.ts` |
| Sheet países | `components/explorar/CountriesSheet.tsx` (título Lugares / wiring) |
| Cuenta web | `app/account/index.web.tsx` |
| Vitrina DS (opcional) | `app/design-system.web.tsx`, `search-surface-showcase.tsx`, `explore-filter-chips-showcase.tsx`, `ds-toc-nav.tsx`, `components/design-system/index.ts` |
| Docs DS inventario | `docs/ops/analysis/DS_CANON_INVENTORY_2026-04.md` |
| Orquestación mapa | `lib/explore/map-screen-orchestration.ts` (si hubo ajustes de filtro) |

## Criterios de cierre (QA antes de merge)

- Cerrar/reabrir sheet Lugares: **mismos** chips de país y etiquetas que antes de cerrar (misma sesión).
- Recargar app (web): con sesión **saved/visited**, restaurar preferencias de **etiquetas + país** desde disco.
- Tap en KPI **Lugares** o pastilla **lugares** del mapa: **no** borra el país seleccionado en filtros.
- Consola web: sin warning de `accessibilityElementsHidden` en elementos DOM.
- `npx tsc --noEmit` sin errores.

## Rollback

Revertir la rama elimina: persistencia en `kv`, lógica de hidratación en `MapScreenVNext`, nuevos componentes de fila país/modal extendido y ajustes de a11y. Los usuarios dejarían de restaurar filtros tras reload; el KPI «Lugares» volvería a comportarse como antes si se reintroduce el `setExplorePlacesCountryFilter({ kind: 'all_places' })` en ese handler.

## Relación con OL

- Evidencia para **`OL-EXPLORE-SHEETS-CANON-001`** (filtros + restore + comportamiento CountriesSheet / Search): complementa bitácora [`358`](358-explore-tags-map-countries-kpi-search-ux-2026-04-14.md).
- No cierra el plan de canon de shell completo; documenta **contrato de estado** y **persistencia** en el runtime actual.

## Referencias

- Storage KV: `lib/storage/kv.ts`
- Patrón similar: `lib/storage/mapPinFilterPreference.ts`
