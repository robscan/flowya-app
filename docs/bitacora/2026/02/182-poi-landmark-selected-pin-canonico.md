# 182 — POI/landmark seleccionado usa pin canónico (no badge)

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Contexto

Tras validación visual, el caso de POI como "Mega" seguía sin feedback claro de selección porque algunas selecciones entraban como `landmark` y renderizaban badge pequeño, no pin seleccionado canónico.

## Cambio aplicado

- `components/explorar/MapCoreView.tsx`
  - Se unifica render de preview seleccionado para `poi` y `landmark`.
  - Ambos ahora usan `MapPinSpot` con `selected=true`.
  - Estado visual semántico:
    - `default` -> pin seleccionado default.
    - `to_visit` -> pin seleccionado `to_visit`.

## Resultado esperado

- POI/landmark seleccionado se distingue claramente del no seleccionado.
- Se evita dependencia de badges pequeños para feedback de selección.

## Validación mínima

- Lint OK en archivo modificado.
