# 167 — Search filtros: reagrupar resultados en `Cercanos` y `En el mapa`

Fecha: 2026-02-25

## Contexto

Se decidió reactivar la separación de resultados en filtros de búsqueda (`Por visitar`/`Visitados`) ahora que el bug de listado quedó localizado.

## Implementación

Archivos:

- `components/explorar/MapScreenVNext.tsx`
- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchFloatingNative.tsx`

Cambio:

1. En `MapScreenVNext`, `resultSections` usa títulos:
   - `Cercanos`
   - `En el mapa`
2. En overlays web/native, `renderSectionHeader` vuelve a renderizar títulos de sección cuando el filtro es `saved`/`visited`.
3. Se mantiene el resto de reglas de ranking y guardrails vigentes.

## Validación mínima

- `npm run lint` OK.

