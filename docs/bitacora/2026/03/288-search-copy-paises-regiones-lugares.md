# 288 — Buscador: copy explícito para países, regiones o lugares

Fecha: 2026-03-06  
Tipo: Fix UX/copy  
Área: `search-surface`, `search-pill`, `explore`

## Contexto

El buscador mostraba `Buscar spots`, lo que sesgaba la expectativa del usuario aunque el runtime ya soporta resultados de geografía/lugares en `all` (país/región/lugar).

## Cambios aplicados

1. Placeholder del input actualizado a:
- `Busca: países, regiones o lugares`.

2. Coherencia de entry-point:
- SearchPill default: `Buscar lugares`.
- Accessibility del botón de abrir búsqueda: `Buscar lugares`.

3. Sin cambios de lógica:
- no se modificó controller ni providers de búsqueda;
- no se alteró ranking ni fuentes externas.

## Evidencia

- `components/search/SearchSurface.tsx`
- `components/search/SearchInputV2.tsx`
- `components/design-system/search-pill.tsx`
- `components/explorar/MapScreenVNext.tsx`
- `docs/ops/plans/PLAN_SEARCH_COPY_COUNTRIES_REGIONS_PLACES_2026-03-06.md`

## Validación mínima

- `npm run lint -- --no-cache components/search/SearchSurface.tsx components/search/SearchInputV2.tsx components/design-system/search-pill.tsx components/explorar/MapScreenVNext.tsx`

Resultado esperado:
- sin errores bloqueantes.

## Nota de rollback

Revertir este fix devuelve el copy previo (`Buscar spots`) sin impacto en funcionalidades de búsqueda.
