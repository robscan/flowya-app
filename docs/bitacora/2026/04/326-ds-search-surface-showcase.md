# 326 — Vitrina SearchSurface (ds-run-surface) con chips # (OL-WEB-RESPONSIVE-001)

**Fecha:** 2026-04-05  
**Tipo:** Design System vitrina, búsqueda

## Alcance

- **`SearchSurfaceShowcase`** ([`components/design-system/search-surface-showcase.tsx`](../../../components/design-system/search-surface-showcase.tsx)): embebe **`SearchSurface`** con `useSearchControllerV2` mock, `MapPinFilterInline`, fila **Cualquiera + #etiquetas**, secciones de listado vacío, **`SearchListCard`** con **`distanceText`** (referencia fija vitrina), **imagen de portada**, y en filtro **Visitados** **CTA** `add_image` / `edit_description` / `add_tag` alineados a `MapScreenVNext` + `SearchResultCard`. Contenedor exterior con **padding** `Spacing.xl`, alto interno ~620.
- **`SearchSurface`** ([`components/search/SearchSurface.tsx`](../../../components/search/SearchSurface.tsx)): filas de recomendaciones usan **`SearchListCard`** (nombre canónico; `ResultRow` sigue siendo alias en `search-list-card`).
- **`MapScreenVNext`**: filas `PlaceResult` usan **`SearchListCard`** en lugar del alias.
- Sección **`ds-run-surface`** en [`app/design-system.web.tsx`](../../../app/design-system.web.tsx); inventario DS.

## Validación

- `npm run typecheck`
