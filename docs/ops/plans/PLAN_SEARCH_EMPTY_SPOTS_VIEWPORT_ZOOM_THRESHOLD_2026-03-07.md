# Plan: Spots empty-state por viewport con umbral de zoom

**Fecha:** 2026-03-07  
**Estado:** Propuesto  
**Prioridad:** Alta (Experiencia de búsqueda)  
**Referencia análisis:** [ANALYSIS_SEARCH_EMPTY_SPOTS_VIEWPORT_VS_RADIUS_2026-03-07.md](../analysis/ANALYSIS_SEARCH_EMPTY_SPOTS_VIEWPORT_VS_RADIUS_2026-03-07.md)

---

## Objetivo

Alinear spots Flowya con el viewport en el empty-state del buscador (Todos, query vacía) **solo cuando el zoom es <= umbral**; mantener center+radius cuando el zoom es mayor, para preservar "spots cercanos a ubicación actual" en vistas locales.

---

## Regla de decisión

| Condición | Criterio para `defaultSpotsForEmpty` |
|-----------|--------------------------------------|
| `zoom <= SEARCH_EMPTY_VIEWPORT_ZOOM_THRESHOLD` | Filtrar `filteredSpots` por bbox del viewport |
| `zoom > SEARCH_EMPTY_VIEWPORT_ZOOM_THRESHOLD` | Lógica actual: centro + `SPOTS_ZONA_RADIUS_KM` (10 km) |

---

## Cambios técnicos

### 1. Constante nueva

**Archivo:** [lib/map-core/constants.ts](../../lib/map-core/constants.ts)

```ts
/** Zoom máximo para usar viewport bbox en empty-state de búsqueda (Todos, query vacía). Por encima, se usa center+radius. */
export const SEARCH_EMPTY_VIEWPORT_ZOOM_THRESHOLD = 9;
```

### 2. Cambio en `defaultSpotsForEmpty`

**Archivo:** [components/explorar/MapScreenVNext.tsx](../../components/explorar/MapScreenVNext.tsx)

- Importar `SEARCH_EMPTY_VIEWPORT_ZOOM_THRESHOLD` desde `lib/map-core/constants`.
- En el `useMemo` de `defaultSpotsForEmpty` (L1458-1483):
  - Obtener `zoom` del mapa (ya disponible vía `useMapCore` o equivalente).
  - Si `zoom <= SEARCH_EMPTY_VIEWPORT_ZOOM_THRESHOLD`: obtener bbox con `mapInstance.getBounds()`, filtrar `filteredSpots` por `lat/lng` dentro del bbox, ordenar por distancia al centro, aplicar `slice(0, 10)`.
  - Si `zoom > SEARCH_EMPTY_VIEWPORT_ZOOM_THRESHOLD`: conservar lógica actual (centro + `SPOTS_ZONA_RADIUS_KM`).

---

## Criterios de aceptación / QA

1. **Zoom mundo (zoom 1-2):** Spots visibles en el mapa aparecen en el listado Todos (query vacía).
2. **Zoom país (zoom 4-8):** Spots visibles en el viewport aparecen en el listado.
3. **Zoom ciudad (zoom 10+):** Se mantiene comportamiento de "spots cercanos" (center + 10 km); no se vacía la lista si el usuario está muy zoomed in.
4. Sin regresiones en `saved`/`visited` ni en búsquedas con query escrita.

---

## Relación con otros planes

- **OL-SEARCHV2-001:** Cubre landmarks visibles + fallback externo. Este plan concreta el ajuste de **spots Flowya** en el mismo empty-state.
- **OL-SEARCHV2-EMPTY-VIEWPORT-001:** Nombre sugerido para el loop operativo que implemente este plan.

---

## Rollback

Revertir cambios en `MapScreenVNext.tsx` y en `lib/map-core/constants.ts`. No hay migraciones ni cambios de contrato externo.
