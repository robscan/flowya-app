# 366 — OL-EXPLORE-COUNTRIES-SHEET-LAYOUT-001: KPI países+mapa sin buscador/filtros + scroll

**Fecha:** 2026-04-18  
**Rama:** `feat/ol-explore-countries-sheet-layout-001`

## Objetivo

Cerrar **`OL-EXPLORE-COUNTRIES-SHEET-LAYOUT-001`**: en la variante **resumen países + mini mapa** (KPI, sin detalle de listado Lugares), **no** mostrar el launcher de búsqueda del header ni la barra de filtros Lugares; mantener buscador+filtros **solo** en vista **Lugares** (`countryDetail`). Mejorar **scroll** en peek/medium/extended envolviendo el bloque KPI en `ScrollView` con `nestedScrollEnabled` para convivir con el listado de países.

## Cambios

- [`components/explorar/CountriesSheet.tsx`](../../../components/explorar/CountriesSheet.tsx):
  - `showStandaloneCountriesSearch` exige `isCountryDetailMode`.
  - Eliminada la banda `placesFilterBarKpiWrap` en KPI (antes duplicaba entrada con mapa/listado Lugares).
  - Nuevo contenedor `kpiBodyRoot` + `ScrollView` (`kpiBodyScroll` / `kpiBodyScrollContent`) alrededor de `CountriesSheetKpiRow`, `CountriesMapPreview`, `CountriesSheetVisitedProgress` y lista de países en medium+expanded.

## Resultado

KPI **Por visitar / Visitados**: cabecera + KPI + mapa (+ progreso visitados); búsqueda global y filtros etiqueta/país siguen en **ruta Lugares** y en **mapa / overlay Search**. En **medium/extended** el cuerpo del sheet puede desplazarse si el viewport es bajo.

## Referencia operativa

- [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md) — cola §5 cerrada; siguiente §6 `OL-EXPLORE-SHEETS-CANON-001`.

## Fase 2 (2026-04-18)

Seguimiento en bitácora [`367`](367-ol-explore-countries-sheet-fase-2-mobile-scroll-flyto-desktop.md): lista países solo `expanded` en móvil, scroll único con lista embebida, hint bajo mapa, KPI→expand, fly-to al elegir país y encuadre desktop con padding lateral.
