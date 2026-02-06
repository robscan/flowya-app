# Bitácora 029 (2026/02) — Search V2 S2: Map integration

**Micro-scope:** S2 — Map (mode="spots") + Progressive Search + Infinite scroll + Límites  
**Rama:** `feat/search-v2-s2-map`  
**Objetivo:** Integrar Search V2 en mapa con SpotsStrategy (viewport→expanded→global), infinite scroll, cap/clustering mapa, filtros en query, secciones Cercanos/Vistos recientemente, historial, CTA "Crear".

---

## Qué se tocó

- **lib/search/bbox.ts:** BBox estable (redondeo por zoom), expandBBox para stage expanded.
- **lib/search/spotsStrategy.ts:** createSpotsStrategy con viewport → expanded → global, limit 25, cursor, filtros aplicados sobre getFilteredSpots(), bbox estable.
- **hooks/search/useSearchControllerV2.ts:** Progresión de stage solo en search() inicial (0 resultados → expanded → global); fetchMore solo mismo stage.
- **lib/storage/searchHistory.ts:** getSearchHistory, addSearchHistoryQuery (máx 5).
- **hooks/search/useSearchHistory.ts:** recentQueries, addCompletedQuery, refresh.
- **lib/storage/recentViewedSpots.ts:** getRecentViewedSpotIds, addRecentViewedSpotId (máx 10).
- **app/(tabs)/index.web.tsx:**
  - SEARCH_V2_ENABLED: si true, overlay de búsqueda usa SearchInputV2 + useSearchControllerV2 + SearchResultsListV2; si false, legacy.
  - Toggle FAB: abre/cierra searchV2.isOpen o searchActive según flag.
  - Backdrop oscuro translúcido; secciones "Cercanos", "Vistos recientemente"; historial (Búsquedas recientes) cuando query vacío o <3.
  - CTA "Crear" (sin "¿No encontraste…?" en V2).
  - Cap de pins en mapa (MAP_PIN_CAP = 500); hint "Hay demasiados resultados, acerca el zoom para verlos" cuando filteredSpots.length > 500.
  - getBbox estable (stableBBox en strategy); filtros (pinFilter) pasados a strategy.
- **components/design-system (referencia):** activeMapControl corregido a tipo ActiveMapControl ('spot', 'spot+user' en lugar de 'contextual').

---

## Contrato SpotsStrategy cumplido

- **Stage secuencial:** viewport → expanded → global; solo avanza en search() inicial; fetchMore mismo stage.
- **Limit por batch:** 25 ítems; nextCursor, hasMore.
- **BBox estable:** stableBBox(bbox, zoom) en strategy; mismo zoom/bbox → misma cache key.
- **Filtros en query:** getFilteredSpots() devuelve lista ya filtrada por pin (Todos/Por visitar/Visitados).
- **Mapa:** cap 500 pins; hint cuando se excede.

---

## Guardrails

- Stage y fetchMore no se mezclan: stage solo avanza en runSearch inicial; fetchMore usa stage/cursor actual.
- BBox estable: redondeo por zoom en lib/search/bbox.ts.
- Cap/clustering desde día 1: MAP_PIN_CAP y hint implementados.

---

## Checklist de cierre

- [ ] Contrato SpotsStrategy (viewport-first, progressive, limit, cursor).
- [ ] Filtros aplicados en query (getFilteredSpots).
- [ ] fetchMore / onEndReached en lista de resultados.
- [ ] Cap en mapa + hint "Hay demasiados resultados, acerca el zoom para verlos".
- [ ] Secciones Cercanos + Vistos recientemente.
- [ ] Historial máx 5 (solo queries completadas).
- [ ] CTA "Crear" (sin "Crear spot: …"); sin "¿No encontraste…?" en V2.
- [ ] Tap fuera (backdrop) cierra búsqueda (V2).
- [ ] Build OK.

---

## Rollback

Poner `SEARCH_V2_ENABLED` en `false` en `constants/flags.ts`. El mapa vuelve al buscador legacy.

---

## Riesgo y mitigación

- **Requests tardíos:** requestId + AbortController en controller; progresión de stage con mismo rid.
- **Estado:** Controller e historial por pantalla; recentViewedSpotIds en localStorage.
