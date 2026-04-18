# 370 — Explore: KPI países/lugares (mapa + sheet), toggle expanded, hint mapa

**Fecha:** 2026-04-18  
**Alcance:** pulido UX/UI del bloque **Countries** sin nuevos OL; seguimiento sobre cierre documental `366`–`369`.

## Mapa (overlay sobre controles)

- KPI **Países** y **Lugares**: número + **`ChevronRight`** (paridad con affordance “abre sheet”).
- Contenedor del KPI: `minWidth` + `paddingHorizontal` para acomodar número + icono.

## Sheet países — fila KPI (`CountriesSheetKpiRow`)

- KPI **Países** y **Lugares** en estilo **circular** alineado al overlay del mapa (64×64, borde, sombra sutil).
- **Países** (plegado): icono **`List`** + borde estándar.
- **Países** (móvil `expanded`): mismo `onPress` que en `medium`; aspecto **plegar**: borde e icono **`ChevronDown`** con color **`previewLineCountryColor`** (línea del mini mapa). A11y: “Plegar lista de países”.
- **Lugares**: sigue **`ChevronRight`**.

## `CountriesSheet`

- Hint bajo el mapa (“Toca la imagen…”) **visible también en `expanded`** (antes se ocultaba con el listado).
- **`onCountriesKpiPress`**: solo se omite en **`webDesktopSidebar`**; en móvil **`expanded`** el KPI sigue siendo pulsable (evita regresión: antes `showCountryListSection` deshabilitaba el handler y no se podía plegar).

## `MapScreenVNext` — `handleCountriesKpiPress`

- Vista solo **Países** (`countriesSheetListView == null`):
  - **Móvil / sin sidebar países:** `medium` ↔ `expanded` (toggle); desde vista **Lugares** del sheet → `medium` como antes.
  - **Desktop con panel países (`sidebarCountries`):** sin plegar a `medium` con el KPI cuando ya está `expanded` (no-op en ese caso); resto de estados cae a `medium` si aplica.

## Explícitamente fuera de alcance (decisión)

- **Iconos de bandera por país** en el listado: analizado; **no implementado** en esta entrega (trade-offs: assets/emoji/red/accesibilidad).

## Archivos

- `components/explorar/MapScreenVNext.tsx`
- `components/explorar/CountriesSheet.tsx`
- `components/design-system/countries-sheet-kpi-row.tsx`

## Referencias

- [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md)
- [`369-explore-desktop-hover-pins-search-scroll-kpi-fitbounds-2026-04-18.md`](369-explore-desktop-hover-pins-search-scroll-kpi-fitbounds-2026-04-18.md)
