# 289 — Search cold-start global: paises/lugares populares con semillas aleatorias

Fecha: 2026-03-06  
Tipo: Fix UX/runtime de búsqueda  
Área: `explore/search`, `cold-start recommendations`

## Contexto

En la vista inicial global (fallback sin ubicación), abrir búsqueda con query vacía mostraba pocos spots locales de París, generando inconsistencia con la percepción de "ver el mundo".

## Cambios aplicados

1. Nuevo modo de recomendaciones globales de arranque (cold-start):
- visible solo en `all + query vacía + búsqueda abierta + sin ubicación + sin interacción previa`.

2. Secciones mostradas:
- `Paises populares`
- `Lugares populares`

3. Desactivación segura para evitar conflictos:
- al primer gesto manual de mapa,
- al usar controles de cámara (`Mi ubicación` / `Ver mundo`),
- al escribir query,
- al seleccionar resultado de búsqueda.
- Una vez desactivado en sesión, no vuelve aunque el usuario regrese manualmente al fallback.

4. Semillas curadas locales:
- nuevo módulo `lib/search/coldStartWorldRecommendations.ts`;
- coordenadas con validación de rango;
- orden aleatorio por sesión (shuffle con seed estable durante sesión).

5. Confirmación al tocar lugar semilla:
- si el item viene de seed global, se intenta resolver coordenada real vía `searchPlacesPOI/searchPlaces` antes de enfocar;
- fallback a coordenada semilla si la resolución falla.

6. Scope explícito:
- se omite `Populares en Flowya` por no tener backend agregado en esta fase.

## Evidencia

- `components/explorar/MapScreenVNext.tsx`
- `lib/search/coldStartWorldRecommendations.ts`
- `components/search/SearchSurface.tsx`
- `components/search/SearchInputV2.tsx`
- `components/design-system/search-pill.tsx`
- `docs/ops/plans/PLAN_SEARCH_COLD_START_WORLD_RECOMMENDATIONS_2026-03-06.md`

## Validación mínima

- `npm run lint -- --no-cache components/explorar/MapScreenVNext.tsx lib/search/coldStartWorldRecommendations.ts components/search/SearchSurface.tsx components/search/SearchInputV2.tsx components/design-system/search-pill.tsx`

Resultado esperado:
- sin errores bloqueantes.

## Nota de rollback

Revertir este fix restaura empty-state local previo y elimina el bootstrap global de arranque.
