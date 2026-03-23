# 312 — Search V2: superficie del panel por filtro y fondo gris en «Todos»

Fecha: 2026-03-22
Tipo: UX / coherencia visual con CountriesSheet

## Contexto
Se alineó el contenedor del buscador (chrome del panel, no el árbol `SearchSurface`) con los mismos tokens de color que el sheet de países cuando el filtro de pins está en «Por visitar» o «Visitados». Con filtro «Todos», el panel usa un gris tenue dedicado (`searchPanelAllBackground`) para no competir con el mapa y mantener luminancia coherente con los paneles `countriesPanel*`.

## Cambios aplicados
- Helper centralizado `getSearchPanelSurfaceColors(pinFilter, scheme, variant)` en `lib/search/searchPanelSurface.ts`.
- Tokens `searchPanelAllBackground` en `constants/theme.ts` (light/dark).
- Adapters `SearchOverlayWeb` y `SearchFloatingNative` aplican fondo (y borde en nativo) según `pinFilter`.
- Documentación actualizada en `docs/definitions/search/SEARCH_V2.md`, `docs/contracts/SEARCH_V2.md` y `docs/contracts/explore/SEARCH_RUNTIME_RULES.md`.
- Plan de trabajo: `docs/ops/plans/PLAN_SEARCH_PANEL_SURFACE_BY_FILTER_2026-03-22.md`.

## Evidencia (archivos)
- `lib/search/searchPanelSurface.ts`
- `constants/theme.ts`
- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchFloatingNative.tsx`

## Validación mínima
- `npx tsc --noEmit`
- Checklist manual: web y nativo, filtro Todos vs Por visitar / Visitados (fondo y legibilidad).

## Rollback
Revertir el helper, tokens y uso en los dos adapters; restaurar versiones anteriores de los contratos si aplica.
