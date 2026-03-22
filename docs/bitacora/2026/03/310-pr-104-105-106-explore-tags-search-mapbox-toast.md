# Bitácora 310 (2026/03) — PRs #104–#106: búsqueda/Mapbox, edición ubicación, etiquetas Explore

**Fecha:** 2026-03-22  
**Tipo:** Revisión de integración + cierre documental + OL

## PRs revisados (últimas horas)

| PR | Rama | Resumen |
|----|------|---------|
| **#104** | `feat/qa-search-filter-map-2026-03-21` | Búsqueda: filtro + merge Mapbox y encuadre Mapbox en spots. |
| **#105** | `feat/edit-spot-location-search-mapbox` | Edición de ubicación Mapbox, bbox v6 y encuadre al volver al mapa. |
| **#106** | `feat/explore-tags-hashtags` | Etiquetas de usuario en pins, búsqueda y sheet; migraciones `020`/`021`; `SystemStatusBar` / toast; `SpotSheet` (meta fila distancia + chips + Etiquetar); `TagChip`, `lib/tags.ts`, `SearchSurface` + cards. |

## OL actualizados

- **`OL-EXPLORE-TAGS-001`:** **cerrado** con merge #106. Plan operativo: `docs/ops/plans/PLAN_OL_EXPLORE_TAGS_001_2026-03-03.md` (marcado CERRADO).
- **Contratos nuevos / actualizados:**
  - `docs/contracts/USER_TAGS_EXPLORE.md` — reglas de creación de etiquetas, RLS, UI (`TagChip`, chips de filtro en `SearchSurface`, cards, sheet, modal).
  - `docs/contracts/SYSTEM_STATUS_TOAST.md` — duración, paleta invertida, anclaje Explore, **recálculo de posición con buscador abierto** (sin sumar altura del sheet).
  - `docs/contracts/SEARCH_V2.md` — §12 etiquetas personales + enlaces a los contratos anteriores.

## Design system

- Página `app/design-system.web.tsx`: sección **Etiquetas** (`TagChip` + variantes) y ampliación de **SearchListCard** con `tagChips` / acción Etiquetar; demo de **toast** Explore vía `useSystemStatus`.

## Evidencia técnica (#106)

- Migraciones: `020_user_tags_pin_tags.sql`, `021_user_tags_set_user_id_trigger.sql`
- Fix runtime: `onEdit` desestructurado en `SpotSheetBody` (evita `ReferenceError` en sheet expandido).

## Estado

- Bitácora y `OPEN_LOOPS` alineados con cierre de etiquetas Explore y documentación replicable en nativo.
