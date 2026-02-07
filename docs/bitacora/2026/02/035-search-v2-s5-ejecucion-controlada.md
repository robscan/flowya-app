# Bitácora 035 (2026/02) — Search V2 S5: Ejecución controlada

**Rama:** `chore/search-v2-s5-cleanup`  
**Referencia:** [032 — Search V2 S5 Cleanup](032-search-v2-s5-cleanup.md) (qué se eliminó en S5).

---

## Objetivo de esta ejecución

Consolidar Search V2 y limpiar restos de legacy sin introducir regresiones, con rollback claro.

---

## Qué se verificó

- **`app/(tabs)/index.web.tsx`:** Sin bloque legacy. No existe `SEARCH_V2_ENABLED` ni estados/handlers del search antiguo (`searchActive`, `searchQuery`, `searchResults`, `orderedSearchResults`, `resolvedPlace`, etc.). Solo rama V2: `useSearchControllerV2`, `SearchInputV2`, `SearchResultsListV2`, `createSpotsStrategy`.
- **`constants/flags.ts`:** Ya eliminado (no existe en el repo).
- Create from search usa `resolvePlaceForCreate` en index; tipo genérico `{ name, latitude, longitude }`.

---

## Qué se removió en esta ejecución

- **`lib/mapbox-geocoding.ts`:** Función `resolvePlace` (exportada pero no importada en ningún archivo). Se mantienen `ResolvedPlace`, `ResolvePlaceForCreateOptions` y `resolvePlaceForCreate`, que son los usados por el flujo actual (CTA Crear en Map Search).

---

## Contratos (verificación)

- Stages viewport → expanded → global: implementados en controller + strategy.
- Cache no bloquea chaining: fix en `useSearchControllerV2` (condición `useCache` con `st !== 'global'`) ya aplicado.
- Infinite scroll / fetchMore: `SearchResultsListV2` + `onEndReached` en index.
- Panel integrado (un solo scroll en idle): implementado (034).
- Create Spot mode=places: `navigateToCreateSpotFromSearch(place, …)` y `/create-spot` con params.

---

## QA mínimo

Ejecutar en web (mapa + search):

| Caso                   | Acción                                         | Esperado                                      |
| ---------------------- | ---------------------------------------------- | --------------------------------------------- |
| Idle + búsqueda        | Abrir search, query < 3 luego ≥ 3              | Historial/Cercanos → resultados o sugerencias |
| fetchMore              | Término con muchos resultados, scroll al final | Más ítems sin duplicados                      |
| Sugerencias            | Query sin resultados                           | Sugerencias + CTA Crear                       |
| Misma búsqueda 2 veces | Ej. "Sagrada", borrar, "Sagrada" de nuevo      | Resultados correctos (cache por stage)        |
| Crear desde search     | Sin resultados, tap Crear                      | Navega a create-spot con query/place          |
| Create-spot con params | Entrar con `?lat=&lng=&query=`                 | Formulario con ubicación/query                |
| Create-spot sin params | Entrar directo a /create-spot                  | Formulario vacío                              |

**Resultado QA:** Pasado.

---

## Rollback

No hay flag; el único rollback es **revert del PR** (revertir commit que elimina `resolvePlace` si se necesitara restaurar; en el repo actual no hay referencias a `resolvePlace`).
