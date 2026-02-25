# 166 — Query vacía en filtros: ocultar título `Spots cercanos`

Fecha: 2026-02-25

## Contexto

QA reportó que seguía apareciendo título en listados de filtros.
La captura confirmó que era la rama `query vacía` (header `Spots cercanos`), no la rama de resultados de búsqueda activa.

## Implementación

Archivos:

- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchFloatingNative.tsx`

Cambio:

- Cuando el filtro activo es `saved` o `visited`, se oculta también el header `Spots cercanos` en estado `isEmpty`.

## Validación mínima

- `npm run lint` OK.

