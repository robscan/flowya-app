# 160 — Search: ordenar sobre el objeto que renderiza la lista (`resultsOverride`)

Fecha: 2026-02-25

## Contexto

Se detectó duda válida: ajustes previos podían quedarse en capa de strategy/controller y no impactar de forma evidente el objeto final que pinta la lista.

## Implementación

Archivos:

- `components/search/types.ts`
- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchFloatingNative.tsx`
- `components/explorar/MapScreenVNext.tsx`

Cambio:

1. Se agrega `resultsOverride` en `SearchFloatingProps`.
2. Overlays web/native renderizan `displayResults = resultsOverride ?? controller.results`.
3. `MapScreenVNext` construye `searchDisplayResults` (ordenados por centro de viewport para `saved/visited`) y los pasa por `resultsOverride`.
4. Secciones de resultados (`resultSections`) se calculan sobre ese mismo arreglo renderizado.

## Resultado esperado

- El orden aplicado impacta directamente el listado visible en UI.
- Evita discrepancias entre datos del controller y datos renderizados.

## Validación mínima

- `npm run lint` OK.

