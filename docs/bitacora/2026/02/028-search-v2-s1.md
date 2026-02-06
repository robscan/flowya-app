# Bitácora 028 (2026/02) — Search V2 S1: Foundation

**Micro-scope:** S1 — P0 Foundation  
**Rama:** `feat/search-v2-s1-foundation`  
**Objetivo:** UI canónica + controller + feature flag con contratos stage, cursor/hasMore/fetchMore, cache TTL y strategy interface.

---

## Qué se tocó

- **constants/flags.ts:** creado; `SEARCH_V2_ENABLED` (boolean, por defecto false).
- **lib/search/normalize.ts:** normalización para cache key y futuras sugerencias (acentos, casing).
- **hooks/search/useSearchControllerV2.ts:** controller con query, setQuery, clear; debounce único; requestId + AbortController; stage (viewport | expanded | global); cursor, hasMore, fetchMore; cache in-memory TTL 60s; strategy `search({ query, stage, bbox, filters, cursor })`; threshold 3 chars.
- **components/search/SearchInputV2.tsx:** input + clear "X" integrado (sin rectángulo/fondo blanco).
- **components/search/SearchResultsListV2.tsx:** listado por secciones; onEndReached para fetchMore (conexión en S2).
- **components/search/index.ts:** exports.
- **docs/definitions/search/SEARCH_V2.md:** source of truth Search V2.
- **docs/bitacora/2026/02/028-search-v2-s1.md:** esta entrada.

---

## Contratos

- **SearchInputV2:** value, onChangeText, onClear, placeholder, autoFocus, clearVisible implícito (value.length > 0). Clear sin caja ni backgroundColor propio.
- **useSearchControllerV2:** mode, isToggleable, defaultOpen; strategy; getBbox, getFilters opcionales; API: query, setQuery, clear, results, sections, stage, cursor, hasMore, fetchMore, isLoading, isOpen, setOpen, onSelect, onCreate, setOnSelect, setOnCreate. Threshold 3; una llamada en vuelo; cache key `${mode}:${stage}:${filters}:${bbox}:${normalizedQuery}:${cursor?}`.

---

## Qué NO se tocó

- Pantallas (Map, Create Spot). No integración en producción; solo base reutilizable.
- Mapbox geocoding (usado en S4 para places).
- Búsqueda real de spots (strategy en S2).

---

## Checklist de cierre

- [ ] Build OK.
- [ ] SearchInputV2 renderiza; clear "X" integrado (sin fondo blanco).
- [ ] Con query < 3 caracteres no se muestran resultados (threshold en controller).
- [ ] Controller: una sola llamada en vuelo; respuestas tardías ignoradas; cache TTL; fetchMore/cursor/hasMore expuestos.
- [ ] Bitácora 028 y SEARCH_V2.md creados.

---

## Rollback

Apagar `SEARCH_V2_ENABLED` (false). Si se elimina la rama: volver a main y no usar componentes/hooks de Search V2.

---

## Riesgo y mitigación

- **Requests tardíos:** RequestId + AbortController en cada nueva búsqueda.
- **Estado:** Controller por pantalla; sin store global.
- **Cache:** TTL 60s; key incluye mode, stage, bbox, filters, query normalizado, cursor.
