# Inventario de canon — Design System (2026-04)

Fuente barrel: [`components/design-system/index.ts`](../../components/design-system/index.ts). Vitrina web: [`app/design-system.web.tsx`](../../app/design-system.web.tsx). Layout web compartido: [`lib/web-layout.ts`](../../lib/web-layout.ts). [^1]

## Vitrina web (taxonomía y navegación)

- **Tabla de contenidos interactiva:** datos en `DS_TOC_GROUPS` ([`ds-toc-nav.tsx`](../../components/design-system/ds-toc-nav.tsx)) con **cuatro grupos** (Intro, Primitivos, Componentes, Templates) y **acordeón** por grupo (cabecera plegable, chevron, enlaces anidados). Estado por defecto: grupos **plegados**; al expandir se listan las anclas. En viewport **≥ 768px** el índice es **columna lateral** (~232px); en web `position: sticky`. Por debajo de ese ancho, **modal** con el mismo árbol; al elegir un enlace se hace scroll y se cierra el modal.
- **Capas (cuerpo alineado al TOC):** **Intro** (`ds-top` inicio, `ds-intro` alcance/contratos) → **Primitivos** (paleta [`colors-showcase.tsx`](../../components/design-system/colors-showcase.tsx), tipografía, **espaciado / radio / elevación** por secciones `ds-fund-spacing`, `ds-fund-radius`, `ds-fund-elevation` en [`ds-token-swatches.tsx`](../../components/design-system/ds-token-swatches.tsx); tokens `Elevation.*` con alias `Shadow.*` en `constants/theme.ts`, WR-01) → **Componentes** (incl. **Países** KPI / mapa preview / progreso / lista; **Exploración** listado `TravelerLevelsList`, pastilla `ExploreCountriesFlowsPill`; **SheetHandle** en `ds-comp-sheet-handle`) → **Templates** (MapLocationPicker, Spot Detail, **Países** plantilla completa + imagen compartir, Explore banda inferior productiva (`ds-pat-explore`), modales + **Niveles de exploración** `TravelerLevelsModal` en `ds-modal-explorer-levels`, **SearchSurface** embebido (`SearchSurfaceShowcase` en **ds-run-surface**); anclas `ds-explore-countries-*` y `ds-pat-*` conservadas).
- **Layout vitrina:** `content` con `maxWidth: 960` centrado (lectura en desktop sin perder WR-01 en demos).
- **Solo vitrina (no barrel de producto):** [`design-system-section.tsx`](../../components/design-system/design-system-section.tsx) (`DesignSystemSection`, `DesignSystemGroupHeading`), [`ds-token-swatches.tsx`](../../components/design-system/ds-token-swatches.tsx) (`DsSpacingSwatches`, `DsRadiusSwatches`, `DsElevationSwatches`), [`icon-button-showcase.tsx`](../../components/design-system/icon-button-showcase.tsx) (`IconButtonShowcase`), [`clear-icon-circle-showcase.tsx`](../../components/design-system/clear-icon-circle-showcase.tsx) (`ClearIconCircleShowcase`), [`image-showcase.tsx`](../../components/design-system/image-showcase.tsx) (`ImagesShowcase`), [`search-surface-showcase.tsx`](../../components/design-system/search-surface-showcase.tsx) (`SearchSurfaceShowcase`), [`ds-toc-nav.tsx`](../../components/design-system/ds-toc-nav.tsx) (`DsTocNav`, `DS_TOC_GROUPS`).

## Excepciones documentadas

| Tema | Nota |
|------|------|
| Fila de chips en `SearchSurface` | No es `TagChip`; estilos propios para filtro de búsqueda. Ver **ds-run-surface** + sección TagChip. |
| Fila de chips en `CountriesSheet` (detalle país) | Misma semántica que búsqueda (Cualquiera + `#etiqueta`); estilos locales alineados a `SearchSurface`, no `TagChip`. Runtime `components/explorar/CountriesSheet.tsx`; bitácora `328`. |
| `SearchInputV2` en vitrina | Sección **ds-mapa-search**; runtime en `SearchSurface`. |
| Modales en `../ui/` | `ConfirmModal`, `FlowyaBetaModal` reexportados en barrel; implementación en `components/ui/`. |
| Overlay demo Explore (KPI + cabecera) | Fondos `rgba` aproximados; comentario en vitrina — no token único en theme. |

## Matriz (archivos en `components/design-system/`)

| Componente / archivo | Barrel | Vitrina web | Uso runtime principal |
|----------------------|--------|-------------|------------------------|
| `buttons.tsx` | Sí | Sí (`ButtonsShowcase` matriz) | Flujos create/edit/auth |
| `colors-showcase.tsx` | Sí | Sí | — |
| `countries-kpi-row-demo.tsx` | Sí | No vitrina dedicada (barrel; KPI en **ds-comp-countries-kpi**) | Helper sobre `CountriesSheetKpiRow` |
| `countries-map-preview.tsx` (+ `.web`) | Sí | Sí (**ds-comp-countries-map-preview**) | Mini mapa países; runtime `CountriesSheet` |
| `countries-sheet-country-list.tsx` | Sí | Sí (**ds-comp-countries-list**) | `CountriesSheet` listado |
| `countries-sheet-kpi-row.tsx` | Sí | Sí (**ds-comp-countries-kpi**) | `CountriesSheet` KPI |
| `countries-sheet-types.ts` | Sí (tipos) | — | `CountrySheetItem`, `CountriesSheetState` |
| `countries-sheet-visited-progress.tsx` | Sí | Sí (**ds-comp-countries-visited-progress**) | `CountriesSheet` modo visitados |
| `countries-sheet-list-demo.tsx` | Sí | No vitrina dedicada (barrel; lista en **ds-comp-countries-list**; mock `DS_MOCK_COUNTRY_ITEMS` para templates) | Helper sobre `CountriesSheetCountryList` |
| `countries-sheet-template-demo.tsx` | Sí | Sí | KPI + mapa + lista (sheet) |
| `share-countries-card-showcase.tsx` | Sí | Sí | Vista previa PNG `shareCountriesCard` |
| `traveler-levels-list.tsx` | Sí | Sí (**ds-comp-traveler-levels-list**) | `TravelerLevelsModal`, `CountriesSheet` |
| `traveler-levels-modal.tsx` | Sí | Sí (**ds-modal-explorer-levels**) | `CountriesSheet` |
| `clear-icon-circle.tsx` | Sí | Sí (`ClearIconCircleShowcase`) | MapPinFilter, búsqueda |
| `explore-countries-flows-pill.tsx` | Sí | Sí (**ds-comp-explore-countries-flows-pill**) | `MapScreenVNext`, `ExploreMapStatusRow` |
| `explore-flows-badge.tsx` | Sí | Sí | `ExploreCountriesFlowsPill`, Explore shell |
| `explore-map-status-row.tsx` | Sí | Sí (demo en **ds-pat-explore** con banda inferior) | `MapScreenVNext` |
| `explore-search-action-row.tsx` | Sí | Sí (**ds-pat-explore** con `fullWidth` para paridad WR-01 / sheet) | Banda inferior Explore; prop `fullWidth` (runtime KPI / `WEB_SHEET_MAX_WIDTH`): bitácora `330`. |
| `flowya-feedback-trigger.tsx` | Sí | Sí | Explore |
| `icon-button.tsx` | Sí | Sí (`IconButtonShowcase`) | Sheet, mapa, búsqueda |
| `image-fullscreen-modal.tsx` | Sí | Sí (`ImagesShowcase`, ds-medios) | SpotSheet, galería |
| `image-placeholder.tsx` | Sí | Sí (`ImagesShowcase`, ds-medios) | Create/edit spot |
| `image-showcase.tsx` | Sí | Sí (`ImagesShowcase`) | — |
| `map-controls.tsx` | Sí | No vitrina dedicada (solo apila `IconButton`; matriz en `IconButtonShowcase`) | Mapa Explore |
| `map-location-picker.tsx` | Sí | Sí | Create spot |
| `map-pin-filter.tsx` | Sí | Sí | Overlay filtros mapa |
| `map-pin-filter-inline.tsx` | Sí | Sí (**ds-mapa-filters** incl. demo saved=0) | Búsqueda Explore; opciones con conteo 0 deshabilitadas y sin badge: bitácora `330`. |
| `map-pin-filter-menu-option.tsx` | Sí | No vitrina dedicada (filas dentro de `MapPinFilter`) | Menú 3 opciones (hijo de filtro) |
| `map-pins.tsx` | Sí | Sí (`MapPinsShowcase`) | Mapa; paridad con `spots-layer` / `mapPinSpot` — ver `docs/contracts/MAP_PINS_CONTRACT.md`, bitácora `321` |
| `search-launcher-field.tsx` | Sí | Sí (dentro de **ds-pat-explore** vía `ExploreSearchActionRow`; sin demo aislada) | `ExploreSearchActionRow`, `SearchFloatingNative` |
| `search-list-card.tsx` | Sí | Sí | Resultados búsqueda; layout 3 filas (título+chevron \| contenido \| meta); bitácora `327` |
| `search-pill.tsx` | Sí | No vitrina dedicada (retirada; superseded por banda inferior) | `BottomDock` (nativo) |
| `search-result-card.tsx` | Sí | No vitrina dedicada (adapter spot → `SearchListCard`; matriz en vitrina `SearchListCard`) | Listado búsqueda mapa |
| `search-surface-showcase.tsx` | Sí | Sí (**ds-run-surface**) | — (demo `SearchSurface` + `SearchListCard`: distancia, cover, visitado CTA) |
| `sheet-handle.tsx` | Sí | Sí (**ds-comp-sheet-handle**) | SpotSheet, SearchFloating, sheets |
| `spot-card.tsx` | Sí | No (barrel; sin vitrina ni consumidor en rutas; lista/búsqueda usan `SearchListCard`) | — |
| `spot-detail.tsx` | Sí | Sí (`SpotDetailShowcase`; sección **ds-tpl-spot-detail**) | Detalle lugar (`app/spot/[id].web`) |
| `spot-image.tsx` | Sí | Sí (`ImagesShowcase`, ds-medios) | Cards, sheet |
| `tag-chip.tsx` | Sí | Sí | Etiquetas |
| `typography.tsx` | Sí | Sí | — |
| Reexport `ConfirmModal` | Sí | Sí | Auth, logout |
| Reexport `FlowyaBetaModal` | Sí | Sí | Beta |

## Runtime Explore (fuera de `components/design-system/` — canon documentado)

| Componente / ruta | Barrel DS | Vitrina | Nota |
|---------------------|-----------|---------|------|
| `components/design-system/explore-welcome-sheet.tsx` + `explore-chrome-shell.tsx` | Shell producto | Vitrina vía `ds-pat-explore` | `ExploreChromeShell` unifica banda KPI + sheet bienvenida; `ExploreWelcomeSheet` lista cold-start. Re-export deprecado en `components/explorar/ExploreWelcomeSheet.tsx`. Bitácora `331`. |
| `components/explorar/CountriesSheet.tsx` | Tipos en `countries-sheet-types.ts` (barrel) | Parcial (KPI, lista, mapa, plantilla) | Persistencia estado/tamaño por filtro; detalle país: bitácora `328`. Lista países en medium+expanded, toasts si sheet expandido: bitácora `330`. |

## Criterio

- **Barrel + runtime Explore/search/sheet:** deben poder inspeccionarse en la vitrina web o documentarse aquí como primitiva interna.
- **Layout web (OL-WEB-RESPONSIVE-001):** anchos máximos alineados con `lib/web-layout.ts` (`WEB_SEARCH_OVERLAY_MAX_WIDTH`, `WEB_SHEET_MAX_WIDTH`, etc.). Avance DS Explore / pastilla visitados: bitácora `322`. Taxonomía SheetHandle: bitácora `323`. Retiro SearchPill/SearchLauncherField en vitrina: bitácora `324`. ds-pat-explore FLOWYA + logout: bitácora `325`. Vitrina SearchSurface (`SearchSurfaceShowcase`): bitácora `326`. `SearchListCard` layout tres filas (chevron en fila de título): bitácora `327`. CountriesSheet detalle por país (chips + lista): bitácora `328`. Explore welcome shell + cold-start/toasts/persistencia: bitácora `329`. CountriesSheet medium/lista, toasts expanded, filtros inline con 0, banda inferior `fullWidth`: bitácora `330`.

[^1]: Última actualización de inventario vinculada a cierre de producto: bitácora `330` (abril 2026).
