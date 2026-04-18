# 367 — Countries sheet fase 2: móvil (lista + scroll), KPI, fly-to y encuadre desktop

**Fecha:** 2026-04-18  
**Continúa:** [`366`](366-ol-explore-countries-sheet-layout-kpi-map-chrome-scroll.md) (`OL-EXPLORE-COUNTRIES-SHEET-LAYOUT-001`).

## Objetivo

Afinar el sheet de países en **móvil** (lista solo en `expanded`, un solo scroll con el bloque KPI), **hint** bajo el mapa en KPI sin lista, **chip países** que desde `medium` sin lista pasa a `expanded`, **encuadre del mapa** al elegir país en listado y en mini mapa con **padding izquierdo** alineado al sidebar web, y estilo KPI más legible (radio DS, borde/fondo).

## Cambios

- [`components/explorar/CountriesSheet.tsx`](../../../components/explorar/CountriesSheet.tsx): `showCountryListSection` (sidebar o `state === "expanded"`); hint condicionado; lista embebida en scroll padre sin `maxHeight` forzada cuando aplica.
- [`components/design-system/countries-sheet-country-list.tsx`](../../../components/design-system/countries-sheet-country-list.tsx): prop `embeddedInParentScroll` (sin `ScrollView` interno).
- [`components/design-system/countries-sheet-kpi-row.tsx`](../../../components/design-system/countries-sheet-kpi-row.tsx): `borderInteractive`, `Radius.searchSurfacePill`, fondo elevado en chips accionables, `Elevation.subtle` en web.
- [`components/explorar/MapScreenVNext.tsx`](../../../components/explorar/MapScreenVNext.tsx): `computeLngLatBoundsFromSpots`, ref de layout sidebar para `fitBounds`; `handleCountriesKpiPress` (medium móvil → expanded); `handleCountryBucketPress` (fly-to país); `handleCountriesMapCountryPress` (no `peek` en sidebar desktop + padding izquierdo).

## Verificación manual sugerida

- Móvil: `medium` sin lista + hint; tap KPI países → `expanded` con lista; scroll único (KPI + mapa + lista).
- Web ≥1080: panel países lateral; tap país en mini mapa → mapa principal encuadrado sin colapsar panel; tap fila país → Lugares + fly-to coherente.

## Referencia operativa

- [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md) — nota de ampliación en sincronización; siguiente en cola sin cambiar: `OL-EXPLORE-SHEETS-CANON-001`.
