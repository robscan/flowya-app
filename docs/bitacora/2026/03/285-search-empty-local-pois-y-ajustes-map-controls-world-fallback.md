# 285 — Search empty local (sin API) + ajustes de Map Controls (world/reframe/fallback)

Fecha: 2026-03-04  
Tipo: Fix runtime + ajuste UX/control de costo  
Área: `explore/search`, `map-controls`, `map-core`

## Contexto

Se detectó que el parche de empty recommendations podía elevar costo de API en `Todos + query vacía` y no resolvía cobertura en varios países del sur global.  
También se ajustó comportamiento de controles de mapa para consistencia operativa solicitada.

## Cambios aplicados

1. Search empty-state:
- se eliminó fallback externo por categorías en `Todos + query vacía`;
- se mantiene fuente local (spots + features visibles del mapa);
- se amplió heurística para capturar POIs visibles con señales de capa/metadata sin consultas extra.

2. Map controls:
- `Encuadre contextual` reinicia a modo `spot` al cambiar selección (primer tap prioriza spot);
- `Ver el mundo`: `GLOBE_ZOOM_WORLD = 1`;
- retorno de toggle world: `GLOBE_ZOOM_INITIAL = 4`.

3. Fallback sin geolocalización:
- vista inicial pasa a Torre Eiffel (`lng 2.2945`, `lat 48.8584`, `zoom 1`).

## Evidencia

- `components/explorar/MapScreenVNext.tsx`
- `lib/search/emptyRecommendations.ts`
- `components/design-system/map-controls.tsx`
- `hooks/useMapCore.ts`
- `lib/map-core/constants.ts`

## Validación mínima

- `npm run lint -- --no-cache components/explorar/MapScreenVNext.tsx lib/search/emptyRecommendations.ts`
- `npm run lint -- --no-cache components/design-system/map-controls.tsx hooks/useMapCore.ts`
- `npm run lint -- --no-cache hooks/useMapCore.ts lib/map-core/constants.ts`

Resultado: sin errores bloqueantes (warning preexistente de `react-hooks/exhaustive-deps` en `hooks/useMapCore.ts`).
