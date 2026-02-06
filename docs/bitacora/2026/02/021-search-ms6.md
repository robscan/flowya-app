# Bitácora 021 (2026/02) — B2-MS6: Prioridad por contexto del mapa (viewport)

**Micro-scope:** B2-MS6  
**Rama:** `search/B2-MS6-prioridad-viewport`  
**Objetivo:** Ordenar resultados de búsqueda: viewport primero, luego cercanos al centro del mapa, resto al final. Sin reordenar si el mapa aún no existe (evitar saltos al cargar).

---

## Qué se tocó

- **app/(tabs)/index.web.tsx:**
  - Nuevo `useMemo` `orderedSearchResults`: cuando existe `mapInstance` y hay resultados, obtiene `getBounds()` y `getCenter()`, clasifica cada spot como dentro/fuera del viewport y ordena (primero los que están en viewport, luego por distancia al centro). Si `mapInstance` es null o no hay resultados, devuelve `searchResults` sin modificar (no reordenar).
  - La lista de resultados cuando hay query usa `orderedSearchResults` en lugar de `searchResults` para el `.map()`.

---

## Qué NO se tocó

- Create Spot, resolución de lugar, CTA, handoff. defaultSpots (sin query) no se reordena por viewport.

---

## Criterio de cierre

- Con mapa cargado: lista ordenada por viewport y luego por distancia.
- Sin mapa: mismo orden que antes (sin saltos al cargar).
- Build limpio.

---

## Rollback

- Eliminar el `useMemo` `orderedSearchResults` y volver a usar `searchResults` en el `.map()` de la lista de resultados con query.
