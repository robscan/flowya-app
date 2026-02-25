# 164 — Resultados de Search sin títulos de sección/etapa

Fecha: 2026-02-25

## Contexto

Para evitar ambigüedad entre cercanos/lejanos cuando el título no comunica claramente, se decidió simplificar:

- quitar títulos en el bloque de resultados de búsqueda.

## Implementación

Archivos:

- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchFloatingNative.tsx`

Cambio:

1. Se elimina render de `stageLabel` en resultados (`isSearch`).
2. Se desactiva render de headers de secciones (`renderSectionHeader={() => null}`).
3. No cambia el orden/ranking de resultados, solo el encabezado visual.

## Validación mínima

- `npm run lint` OK.

