# 158 — Search: reorden por viewport al navegar mapa

Fecha: 2026-02-25

## Contexto

Se definió comportamiento esperado: si usuario navega mapa (ej. de México a España), los resultados de búsqueda deben reorganizarse según viewport actual, no por ubicación del usuario.

## Implementación

Archivos:

- `hooks/useMapCore.ts`
- `components/explorar/MapScreenVNext.tsx`
- `lib/search/spotsStrategy.ts`

Cambios:

1. `useMapCore` expone `viewportNonce` que incrementa en cada `moveend`.
2. `MapScreenVNext` escucha `viewportNonce` y, con búsqueda activa (`query >= 3`), re-ejecuta `setQuery` para refrescar resultados contra bbox actual.
3. `spotsStrategy` en stage global ordena por centro del bbox actual (viewport) en lugar de `0,0`.

## Resultado esperado

- Al mover mapa a otra zona, el ranking de resultados se reordena por proximidad al viewport vigente.
- Comportamiento consistente aunque usuario esté físicamente en otra ciudad/país.

## Validación mínima

- `npm run lint` OK.

