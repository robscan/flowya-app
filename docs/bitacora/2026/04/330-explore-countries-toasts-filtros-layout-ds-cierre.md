# 330 — Explore: CountriesSheet, toasts, filtros, banda inferior; DS y contratos

**Fecha:** 2026-04-06  
**Tipo:** Cierre de bloque — producto + documentación + vitrina DS

## Resumen ejecutivo

Cierre alineado de **runtime Explore** (`MapScreenVNext`, `CountriesSheet`, DS filtros/banda inferior) con **contratos** (`FILTER_RUNTIME_RULES`, `SYSTEM_STATUS_TOAST`, `MAP_RUNTIME_RULES`) e **inventario DS 2026-04**.

## Producto (runtime)

- **CountriesSheet:** listado de países/lugares visible en **medium** y **expanded** (no solo expanded); KPI «países» → **medium** + salida de detalle/lista global; KPI «lugares» → **expanded**; `peek` persistido se eleva a **medium** al abrir desde accionables; reglas al cambiar filtro Por visitar ↔ Visitados (carry-over de tamaño, sheet abierto, `useLayoutEffect` vs carrera de persistencia).
- **Toasts:** con sheet en **expanded**, ancla al **borde inferior** del viewport (`anyExploreSheetExpanded`); retirada de supresión por expanded en cambio de filtro/pin; excepciones puntuales (`suppressToastRef`, `toastMessage: ""` pastilla visitados).
- **Persistencia sheet países / `pinFilter`:** restauración en `useLayoutEffect` para no pisar snapshot al volver de `Todos`; al cruzar saved/visited, mantener apertura y nivel visual cuando aplica.
- **Filtros `MapPinFilterInline`:** opciones **Por visitar** / **Visitados** **deshabilitadas** si contador es 0; sin badge «0» (paridad con `MapPinFilter` dropdown).
- **Banda inferior Explore (Por visitar / Visitados):** contenedor `WEB_SHEET_MAX_WIDTH` centrado; **`ExploreSearchActionRow`** con **`fullWidth`** para ocupar el ancho útil (sin tope 520px); fila **FLOWYA + `ExploreMapStatusRow`** con mismo tope WR-01.

## Design System

- Componentes tocados (barrel): `explore-search-action-row` (`fullWidth`), `map-pin-filter-inline` (disabled + a11y), `countries-sheet-kpi-row` (chevron países solo en peek).
- **Vitrina web** `app/design-system.web.tsx`: `ds-pat-explore` con ancho **720** (`WEB_SHEET_MAX_WIDTH`) y demo `fullWidth`; sección filtros mapa con sub-bloque **inline con conteos cero** (estado deshabilitado).

## Contratos

- `SYSTEM_STATUS_TOAST.md` — §2.3 política expanded + toasts; checklist nativos.
- `FILTER_RUNTIME_RULES.md` — reglas 12 CountriesSheet; troubleshooting persistencia / carrera; filtros deshabilitados.
- `MAP_RUNTIME_RULES.md`, `EXPLORE_RUNTIME_RULES_INDEX.md`, `INDEX.md`, definiciones `SYSTEM_STATUS_BAR`.

## Verificación

- `npm run typecheck`
- `npm run lint` (Expo)

## Archivos de referencia

- `components/explorar/MapScreenVNext.tsx`
- `components/explorar/CountriesSheet.tsx`
- `components/design-system/explore-search-action-row.tsx`
- `components/design-system/map-pin-filter-inline.tsx`
- `app/design-system.web.tsx`
- `docs/ops/analysis/DS_CANON_INVENTORY_2026-04.md`
