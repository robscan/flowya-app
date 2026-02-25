# 144 — Selección POI: encuadre contextual y gobernanza de "Ver todo el mundo"

Fecha: 2026-02-25

## Contexto

QA reportó que al seleccionar un POI no existente en Flowya:

- no siempre quedaba claro el modo de encuadre contextual con sheet activa;
- seguía visible el control global "Ver todo el mundo", compitiendo con la selección activa.

## Cambio aplicado

En `MapScreenVNext` se unificó la semántica de selección para controles de mapa:

1. Se introduce `contextualSelection`:
   - usa `selectedSpot` cuando existe,
   - usa selección sintética cuando hay `poiTapped`.
2. `MapControls` ahora recibe `contextualSelection` como `selectedSpot`.
   - resultado: al haber POI seleccionado, se oculta "Ver todo el mundo" y se muestra encuadre contextual.
3. Se agregan handlers contextuales de reencuadre:
   - `handleReframeContextual`: reencuadra al spot o POI activo.
   - `handleReframeContextualAndUser`: para POI usa `fitBounds` con usuario cuando hay ubicación; fallback a reencuadre simple.

## Resultado esperado

- Selección POI no guardado mantiene modo de foco contextual coherente con sheet.
- Se elimina competencia visual de "Ver todo el mundo" durante selección activa.
- No se alteran flujos de spot seleccionado existente.

## Estado

- Implementación técnica: completada.
- Validación pendiente: smoke QA de `OL-P1-010` (POI nuevo, spot existente y deep-link no regresivo).
