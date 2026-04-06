# 324 — Retiro SearchPill/SearchLauncherField en vitrina y tab Explore plantilla (OL-WEB-RESPONSIVE-001)

**Fecha:** 2026-04-05  
**Tipo:** Vitrina DS, routing, inventario

## Alcance

1. **Vitrina web** [`app/design-system.web.tsx`](../../../../app/design-system.web.tsx): sección **ds-pat-explore** sin demos aisladas de `SearchPill` ni `SearchLauncherField` (deprecadas en DS). Se mantiene solo el bloque **productivo**: `ExploreCountriesFlowsPill` + `ExploreSearchActionRow` (el campo de búsqueda sigue siendo el de la banda inferior vía ese componente).
2. **Routing:** eliminado `app/(tabs)/explore.tsx` (plantilla Expo / enlace a Design System). Tabs: solo **`index`** (mapa productivo). Enlaces «volver» desde pantallas Design System → **`/`** («Volver al mapa»).
3. **TOC:** etiqueta `ds-pat-explore` → «Explore: banda inferior».
4. **Inventario:** [`docs/ops/analysis/DS_CANON_INVENTORY_2026-04.md`](../../ops/analysis/DS_CANON_INVENTORY_2026-04.md) — filas `search-pill`, `search-launcher-field`, `explore-map-status-row`.

**Nota:** `SearchPill` y `SearchLauncherField` permanecen en barrel y en runtime (`BottomDock`, `ExploreSearchActionRow`, etc.); solo se retira la vitrina duplicada y la ruta muerta.

## Validación

- `npm run typecheck`
