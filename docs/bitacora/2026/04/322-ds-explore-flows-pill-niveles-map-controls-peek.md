# 322 — DS Explore: pastilla países|flows, niveles de exploración, MapControls vs peek (OL-WEB-RESPONSIVE-001)

**Fecha:** 2026-04-05  
**Tipo:** Design System canon, Explore shell, layout mapa

## Alcance

### Design System (barrel + vitrina)

1. **Niveles de exploración**
   - `TravelerLevelsList` + `TravelerLevelsModal` — listado canónico y modal; `CountriesSheet` consume el modal.
   - Vitrina: `ds-comp-traveler-levels-list`, `ds-modal-explorer-levels` (Templates, junto a modales).
   - Inventario: [`docs/ops/analysis/DS_CANON_INVENTORY_2026-04.md`](../../../ops/analysis/DS_CANON_INVENTORY_2026-04.md).

2. **Explore — métricas visitados**
   - `ExploreCountriesFlowsPill` — pastilla «N países | M flows», un `ChevronRight` al extremo derecho, estado deshabilitado si `countriesCount === 0`, formato `es-MX`.
   - `ExploreMapStatusRow` — composición runtime: `FlowyaFeedbackTrigger` + `ExploreCountriesFlowsPill` (sin mezclar con la vitrina atómica de la pastilla).
   - Vitrina: `ds-comp-explore-countries-flows-pill`; demo Explore en `ds-pat-explore` (pastilla + `ExploreSearchActionRow`; ver bitácora `324` para retiro de SearchPill aislado).
   - TOC: [`components/design-system/ds-toc-nav.tsx`](../../../../components/design-system/ds-toc-nav.tsx).

### Explore / mapa (`MapScreenVNext`)

3. **Solape MapControls vs pastilla (SpotSheet en peek)**  
   - Anclaje: se suma `mapControlsLiftAboveFlowyaStatusRow` al `bottom` de la columna de controles cuando `sheetState === "peek"` e `isFlowyaFeedbackVisible` (constantes `FLOWYA_STATUS_ROW_HEIGHT_ESTIMATE`, `MAP_CONTROLS_CLEARANCE_ABOVE_FLOWYA_ROW`, etc.). Objetivo: subir los controles y dejar visible FLOWYA + pastilla sin traslape geométrico.

4. **Capas (`layer-z`)**  
   - `FLOWYA_LABEL` permanece en **5**; el contrato documenta que el solape con controles se resuelve por posición, no forzando z-index sobre `MAP_CONTROLS`.

## Archivos clave

- [`components/design-system/explore-countries-flows-pill.tsx`](../../../../components/design-system/explore-countries-flows-pill.tsx)
- [`components/design-system/explore-map-status-row.tsx`](../../../../components/design-system/explore-map-status-row.tsx)
- [`components/design-system/traveler-levels-list.tsx`](../../../../components/design-system/traveler-levels-list.tsx), [`traveler-levels-modal.tsx`](../../../../components/design-system/traveler-levels-modal.tsx)
- [`components/explorar/MapScreenVNext.tsx`](../../../../components/explorar/MapScreenVNext.tsx)
- [`components/explorar/layer-z.ts`](../../../../components/explorar/layer-z.ts)
- [`app/design-system.web.tsx`](../../../../app/design-system.web.tsx)

## Validación

- `npm run typecheck`

## Siguiente

- Continuar **OL-WEB-RESPONSIVE-001** según plan web responsivo; ajustar constantes de alto si en dispositivos reales la fila FLOWYA supera la estimación.
