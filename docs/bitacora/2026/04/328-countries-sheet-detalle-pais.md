# 328 — CountriesSheet: detalle por país (por visitar / visitados)

**Fecha:** 2026-04-05  
**Tipo:** Explore, sheet países, paridad datos

## Alcance

- [`components/explorar/MapScreenVNext.tsx`](../../../../components/explorar/MapScreenVNext.tsx): estado `countriesSheetListView` (`CountriesSheetListDetail`: `country` | `all_places`). Lista del detalle con el mismo pool que los buckets; en país filtra por `resolveCountryForSpot`; en **todos los lugares** usa el pool completo del overlay. Etiquetas vía `filterExploreSearchItemsByTag` + `pinTagIndex`. Al pulsar un país se amplía el sheet al detalle; al pulsar **lugares** (KPI del sheet o contador del mapa) se abre el mismo template con el listado completo (sin abrir el buscador). Cierre / búsqueda / etc. limpian la vista donde aplica.
- [`components/design-system/countries-sheet-types.ts`](../../../../components/design-system/countries-sheet-types.ts): tipo `CountriesSheetListDetail`.
- [`components/explorar/CountriesSheet.tsx`](../../../../components/explorar/CountriesSheet.tsx): modo detalle con cabecera **atrás** (`SpotSheetHeader` `backAction`) + cerrar; fila horizontal de chips de etiqueta (semántica alineada a búsqueda); `FlatList` con `SearchResultCard` vía render prop del mapa; KPI, mapa preview, progreso y lista global ocultos en detalle.
- [`components/explorar/spot-sheet/SpotSheetHeader.tsx`](../../../../components/explorar/spot-sheet/SpotSheetHeader.tsx): soporte previo `backAction` para el botón izquierdo «Atrás».

## Validación

- `npm run typecheck`
- Manual: sheet por visitar / visitados → país → lista → atrás / cerrar; KPI **lugares** → listado completo en el mismo template → atrás; contador **lugares** en overlay del mapa; con y sin filtro de etiqueta; pin mapa en Todos vs filtro (la lista no depende del `pinFilter` del mapa).
