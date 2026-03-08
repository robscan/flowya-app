# Análisis: Spots en listado "Todos" (query vacía) — viewport vs radio

**Fecha:** 2026-03-07  
**Objetivo:** Documentar el problema de inconsistencia entre spots visibles en el mapa y spots mostrados en el listado de búsqueda (Todos, query vacía), y justificar la solución con umbral de zoom.

---

## 1. Problema

En Explore, filtro **Todos**, buscador abierto con **query vacía**, el usuario observa que hay spots visibles en el mapa que **no aparecen** en el listado de sugerencias. La expectativa es que lo visible en el mapa coincida con lo accesible en la lista.

---

## 2. Estado actual

### 2.1 Fuentes de datos

| Fuente | Alcance | Criterio |
|--------|---------|----------|
| **Spots en mapa** | Global | `refetchSpots` → SELECT todos los spots (`is_hidden=false`). Sin filtro por viewport. |
| **`defaultSpotsForEmpty`** | Centro + radio fijo | `filteredSpots` dentro de `SPOTS_ZONA_RADIUS_KM` (10 km) del centro del mapa. Independiente del zoom. |
| **`visibleLandmarksEmpty`** | Viewport | `collectVisibleLandmarks(mapInstance)` → `map.queryRenderedFeatures()`. Landmarks Mapbox visibles en pantalla. |

### 2.2 Ubicación en código

- **MapScreenVNext.tsx** L756-781: `refetchSpots` carga spots globales.
- **MapScreenVNext.tsx** L1458-1483: `defaultSpotsForEmpty` usa `mapInstance.getCenter()` + `distanceKm(...) <= SPOTS_ZONA_RADIUS_KM`.
- **MapScreenVNext.tsx** L1486-1493: `visibleLandmarksEmpty` usa `collectVisibleLandmarks(mapInstance)`.
- **lib/map-core/constants.ts** L42: `SPOTS_ZONA_RADIUS_KM = 10`.

---

## 3. Consecuencia

En **vista mundo** o **vista país/continente** (zoom alejado):

- El centro del mapa puede estar en medio del océano o en un punto arbitrario.
- Solo aparecen en el listado los spots dentro de 10 km de ese centro.
- Los spots visibles en el mapa en otras regiones (ej. Europa, América) **no se muestran** en la lista.
- Landmarks Mapbox sí coinciden con el viewport (usan `queryRenderedFeatures`), generando inconsistencia: landmarks visibles aparecen, spots Flowya visibles no.

---

## 4. Regla de zoom propuesta

El ajuste debe aplicarse **solo hasta cierto zoom** para preservar el comportamiento deseado cuando el usuario está muy zoomed in:

| Zoom del mapa | Comportamiento para `defaultSpotsForEmpty` |
|---------------|--------------------------------------------|
| **Zoom <= umbral** (alejado, ej. país/continente/mundo) | Usar **bbox del viewport** — spots visibles en el mapa aparecen en el listado |
| **Zoom > umbral** (cercano, ej. ciudad/barrio) | Mantener **centro + SPOTS_ZONA_RADIUS_KM** — spots cercanos a la ubicación actual del usuario |

**Justificación:** Cuando el usuario está muy zoomed in (solo ve un spot o pocos), el criterio "spots cercanos a mi ubicación" es más útil que el viewport estricto. Cuando está zoomed out (vista amplia), el criterio "lo que veo en el mapa" debe primar.

**Umbral sugerido:** `zoom <= 9` (nivel país/región). Referencia: `GLOBE_ZOOM_WORLD = 1`, `GLOBE_ZOOM_INITIAL = 4`, `SPOT_FOCUS_ZOOM = 17` en `lib/map-core/constants.ts`.

---

## 5. Decisión de producto (evolución futura)

- **Fix corto plazo:** Umbral de zoom para elegir viewport vs. center+radius.
- **Evolución futura:** Base de datos curada (países, regiones, spots relevantes) para alimentar búsqueda y listados, considerando viewport y prioridades de contenido. Esto permite control de calidad sin depender exclusivamente de APIs externas ni de la geometría de tiles Mapbox.

---

## 6. Referencias

- [components/explorar/MapScreenVNext.tsx](../../components/explorar/MapScreenVNext.tsx)
- [lib/map-core/constants.ts](../../lib/map-core/constants.ts)
- [docs/ops/plans/PLAN_SEARCH_EMPTY_SPOTS_VIEWPORT_ZOOM_THRESHOLD_2026-03-07.md](../plans/PLAN_SEARCH_EMPTY_SPOTS_VIEWPORT_ZOOM_THRESHOLD_2026-03-07.md)
- [docs/ops/plans/PLAN_OL_SEARCHV2_001_EMPTY_LANDMARKS_VISIBLE_FALLBACK_2026-03-03.md](../plans/PLAN_OL_SEARCHV2_001_EMPTY_LANDMARKS_VISIBLE_FALLBACK_2026-03-03.md)
