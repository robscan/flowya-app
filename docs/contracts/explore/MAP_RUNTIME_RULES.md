# MAP_RUNTIME_RULES

Reglas runtime del mapa en Explorar.

## Scope

- Encadre y reencuadre por selección/filtro.
- Reglas de continuidad visual (spot seleccionado, sheet activa).
- Guardrails de estabilidad (sin saltos inesperados de cámara).

## Reglas canónicas

1. **Selección de spot interno**
- Seleccionar spot enfoca spot.
- Sheet abre en `medium` (o estado definido por contrato de selección).

2. **Cambio de estado desde sheet (`Por visitar` <-> `Visitados`)**
- Si filtro actual es `saved/visited` y el spot cambia al otro filtro:
  - cambiar filtro destino,
  - mantener spot seleccionado,
  - mantener sheet en `medium`,
  - enfocar spot mutado.
- No usar `fitBounds` global en este caso (evitar zoom-out de todo el filtro).

3. **Reencuadre por cambio de filtro (regla general)**
- Al cambiar filtro a `saved/visited`, decidir reencuadre en diferido (después de aplicar filtro y actualizar lista).
- Si hay pines visibles del nuevo filtro en viewport, no mover cámara.
- Si no hay visibles, reencuadrar a todos los pines del filtro.

4. **Selección POI externo**
- Al seleccionar POI, aplicar encuadre contextual con sheet activa.
- Control “Ver todo el mundo” no debe competir con selección activa de POI/spot.

## Core puro recomendado

- `shouldReframeToAll({ visibleCount, totalCount }) => boolean`
- `resolveCrossFilterTransition({ currentFilter, nextStatus }) => nextFilter | null`
- `computeBoundsFromSpots(spots) => bounds`

## Adapter necesario

- `MapAdapter.getBounds()`
- `MapAdapter.flyTo()`
- `MapAdapter.fitBounds()`

## Referencias

- `docs/contracts/SPOT_SELECTION_SHEET_SIZING.md`
- `docs/contracts/EXPLORE_SHEET.md`
- `docs/bitacora/2026/02/153-filtros-saved-visited-reencuadre-ciclico.md`
- `docs/bitacora/2026/02/176-pin-status-cross-filter-auto-switch-continuity.md`
- `docs/bitacora/2026/02/179-filter-reframe-deferred-after-load.md`
