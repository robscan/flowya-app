# 155 — Search placeholder actualizado a `Buscar spots`

Fecha: 2026-02-25

## Contexto

Persistía el copy legacy `Buscar en esta zona del mapa…` en el input de búsqueda.
Se pidió simplificar el mensaje a `Buscar spots`.

## Implementación

Archivos:

- `components/search/SearchInputV2.tsx`
- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchFloatingNative.tsx`

Cambio:

- Placeholder unificado a `Buscar spots` (default del input + uso explícito web/native).

## Validación mínima

- `npm run lint` OK.

