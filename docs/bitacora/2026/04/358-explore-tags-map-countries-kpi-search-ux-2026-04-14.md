# 358 — Explore: etiquetas en mapa (filtro en capa de pines), pastilla activa, icono Tag vs `#`, Countries KPI + búsqueda, secciones Por visitar/Visitados, `SearchListCard` responsivo, autofocus buscador

**Fecha:** 2026-04-14  
**Rama:** `main` (cambios locales documentados en este cierre).

## Resumen

Alineación de **filtro por etiqueta** con la **capa de pines** cuando el usuario está autenticado y el filtro de pin es **guardados/visitados** (`saved` / `visited`): los pines mostrados respetan `selectedTagFilterId` (con re-inclusión del spot seleccionado si queda fuera del filtro). **UX de etiquetas:** sustitución del prefijo `#` por **icono Tag** + nombre en chips y pastillas; **pastilla de filtro activo en mapa** (chip `Pressable` compacto, tint, `ClearIconCircle` variante `onPrimary`). **CountriesSheet / KPI:** affordance (chevron, fila KPI), entrada a búsqueda desde cabecera, criterio compartido **Por visitar / Visitados / lugares en la zona** extraído a lib. **Buscador:** prop `searchInputAutoFocus` propagada; **supresión puntual de autofocus** al abrir búsqueda desde chip de etiqueta en ficha. **Listados:** `SearchListCard` con **flexWrap** en meta (chips) para evitar recortes; refactor de fila de chips de etiquetas a componente compartido. **DS:** vitrina y demos actualizadas.

## Cambios de producto / UX

1. **Mapa — filtro etiqueta ↔ pines**  
   - Con sesión y pin filter `saved`/`visited`, `displayedSpots` aplica `filterExploreSearchItemsByTag` antes del tope de pines; el spot abierto se mantiene visible si aplica la regla de selección.  
   - Orquestación: `lib/explore/map-screen-orchestration.ts` (`filterExploreSearchItemsByTag`).  
   - Pantalla: `components/explorar/MapScreenVNext.tsx`.

2. **Mapa — pastilla «filtrando por etiqueta»**  
   - Chip compacto con icono Tag, nombre de etiqueta, estado tint/azul; limpieza con `ClearIconCircle` / `ClearIconCircleDecoration` variante **`onPrimary`** (contraste sobre fondo tint).  
   - Archivos: `MapScreenVNext.tsx`, `components/design-system/clear-icon-circle.tsx`.

3. **Canon visual etiquetas: icono Tag en lugar de `#`**  
   - Componentes: `ExploreTagIconLabel`, `TagChip` (`showHash`), fila compartida `ExploreTagFilterChipRow`, usos en `CountriesSheet`, `SpotSheet`, listado (`search-list-card`), pastilla mapa, vitrina DS.  
   - Archivos nuevos: `components/design-system/explore-tag-icon-label.tsx`, `components/design-system/explore-tag-filter-chip-row.tsx`.  
   - Ediciones: `components/design-system/tag-chip.tsx`, `components/explorar/CountriesSheet.tsx`, `components/explorar/SpotSheet.tsx`, `components/design-system/search-list-card.tsx`, `app/design-system.web.tsx`, `MapScreenVNext.tsx`.

4. **SearchSurface — refactor**  
   - Lógica/UI de la fila de chips de etiquetas extraída a `ExploreTagFilterChipRow`; `SearchSurface.tsx` queda más delgado y alineado con el mapa.

5. **Buscador — autofocus controlado**  
   - `searchInputAutoFocus` en tipos y superficies (`SearchFloatingProps` / `SearchSurface` / `SearchOverlayWeb` / `SearchFloatingNative`).  
   - `MapScreenVNext`: `suppressSearchInputAutofocusRef` para abrir búsqueda desde chip de etiqueta en ficha **sin** robar foco al input de una sola vez.

6. **SearchListCard — layout responsivo**  
   - Cluster de meta (etiquetas, acciones): **flexWrap** + gaps; chips de etiqueta con `numberOfLines` acotado para evitar cortes en viewports estrechos.  
   - Archivo: `components/design-system/search-list-card.tsx`.

7. **SpotSheet / cabecera**  
   - Ajustes de meta fila y cabecera en línea con chips Tag y flujos de búsqueda.  
   - Archivos: `SpotSheet.tsx`, `spot-sheet/SpotSheetHeader.tsx`.

8. **CountriesSheet — KPI, búsqueda, secciones de lugares**  
   - KPI row: affordance (chevron junto al número / affordance de tap), coherencia con demo DS.  
   - Criterio unificado **Por visitar / Visitados / «lugares en la zona»** (radio, deriva del centro del mapa vs ref usuario):  
     - `lib/explore/saved-visited-place-sections.ts` (**nuevo**).  
   - Integración en `CountriesSheet.tsx` y `MapScreenVNext.tsx` según wiring existente.

9. **Componentes DS auxiliares**  
   - `search-launcher-field.tsx`, `countries-sheet-kpi-row.tsx`, demos `countries-kpi-row-demo.tsx`, `countries-sheet-template-demo.tsx`, exports `index.ts`.  
   - `map-pin-filter.tsx`, `SearchInputV2.tsx`: eliminación de props huérfanas (`backgroundColor` en clear) alineada con API de `ClearIconCircle`.

10. **Tema y layout chrome mapa**  
    - `constants/theme.ts`: tokens/constantes usados por la pastilla/filtros.  
    - `lib/explore-map-chrome-layout.ts`: comentario/alineación con reserva de altura MAP_FILTER.

## Archivos tocados (lista completa)

| Estado | Ruta |
|--------|------|
| Nuevo | `components/design-system/explore-tag-filter-chip-row.tsx` |
| Nuevo | `components/design-system/explore-tag-icon-label.tsx` |
| Nuevo | `lib/explore/saved-visited-place-sections.ts` |
| Modificado | `app/design-system.web.tsx` |
| Modificado | `components/design-system/clear-icon-circle.tsx` |
| Modificado | `components/design-system/countries-kpi-row-demo.tsx` |
| Modificado | `components/design-system/countries-sheet-kpi-row.tsx` |
| Modificado | `components/design-system/countries-sheet-template-demo.tsx` |
| Modificado | `components/design-system/index.ts` |
| Modificado | `components/design-system/map-pin-filter.tsx` |
| Modificado | `components/design-system/search-launcher-field.tsx` |
| Modificado | `components/design-system/search-list-card.tsx` |
| Modificado | `components/design-system/tag-chip.tsx` |
| Modificado | `components/explorar/CountriesSheet.tsx` |
| Modificado | `components/explorar/MapScreenVNext.tsx` |
| Modificado | `components/explorar/SpotSheet.tsx` |
| Modificado | `components/explorar/spot-sheet/SpotSheetHeader.tsx` |
| Modificado | `components/search/SearchFloatingNative.tsx` |
| Modificado | `components/search/SearchInputV2.tsx` |
| Modificado | `components/search/SearchOverlayWeb.tsx` |
| Modificado | `components/search/SearchSurface.tsx` |
| Modificado | `components/search/types.ts` |
| Modificado | `constants/theme.ts` |
| Modificado | `lib/explore-map-chrome-layout.ts` |

Consumo de **`filterExploreSearchItemsByTag`** desde `lib/explore/map-screen-orchestration.ts` (sin cambios de archivo en este diff).

## Decisiones explícitas (sesión)

- **No** reintroducir fila de chips de etiquetas bajo los filtros del mapa cuando un sheet ya muestra la misma fila (evitar duplicado visual).  
- **Revertido** el flag de layout `mapTagFilterStripVisible` en favor de lógica inline en `MapScreenVNext` donde aplique.

## Referencias

- Etiquetas Explore: `docs/contracts/USER_TAGS_EXPLORE.md`.  
- Matriz sheets (contexto canon futuro): `docs/contracts/EXPLORE_SHEETS_BEHAVIOR_MATRIX.md`.  
- Bitácora previa mismo bloque producto/docs: [`357`](357-web-pickers-tags-y-matriz-sheets-followup-canon.md).

## Siguiente loop sugerido (cola operativa)

**`OL-EXPLORE-SHEETS-CANON-001`** — shell compartido (gestos/snap/medición) + slots; Search como excepción; documentación splash Welcome nativo. Plan: `docs/ops/plans/PLAN_OL_EXPLORE_SHEETS_CANON_2026-04-14.md`.
