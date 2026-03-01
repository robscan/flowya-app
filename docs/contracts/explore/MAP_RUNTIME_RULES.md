# MAP_RUNTIME_RULES

Reglas runtime del mapa en Explorar.

## Scope

- Encadre y reencuadre por selección/filtro.
- Reglas de continuidad visual (spot seleccionado, sheet activa).
- Guardrails de estabilidad (sin saltos inesperados de cámara).

## Reglas canónicas

0. **Cámara por intención (OL-WOW-F2-005)**
- **discover** (sin selección): estabilidad de viewport. No auto-moves agresivos. tryCenterOnUser en load aceptable.
- **inspect** (selección activa): centrar solo si spot no legible/visible en viewport (`isPointVisibleInViewport`).
- **act** (createSpotNameOverlayOpen, isPlacingDraftSpot): no programmaticFlyTo. Wrapper `flyToUnlessActMode` omite flyTo cuando act mode.
- Anti-jitter: no encadenar `flyTo` + `fitBounds` para el mismo evento. Auditoría: cada handler usa solo flyTo O fitBounds, nunca ambos encadenados.

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
- Al cambiar filtro a `saved/visited`, no mover cámara automáticamente.
- Reencuadre solo por intención explícita del usuario (controles de reframe) o por transición dirigida a spot concreto.
- Guardrail: prohibido `fitBounds` global automático en cambio manual de filtro.

4. **Selección POI externo**
- Al seleccionar POI, aplicar encuadre contextual con sheet activa.
- Control “Ver todo el mundo” no debe competir con selección activa de POI/spot.
- Si el POI ya corresponde a un spot persistido, resolver a `selectedSpot` (no mantener sheet de POI nuevo).

5. **Estado visual de selección en POI (feedback obligatorio)**
- Un POI seleccionado debe verse distinto al POI no seleccionado, incluso cuando su estado base sea `default`.
- La capa de `selected` no reemplaza semántica de color (`saved/visited`), la complementa.
- Al deseleccionar (tap fuera/cierre sheet), debe volver al estado base no seleccionado.
- Durante selección POI, evitar doble jerarquía textual (labels Flowya competitivos vs labels base del mapa).

6. **Settle de cámara antes de overlays sensibles (2026-03)**
- Cualquier navegación programática relevante (`flyTo`, `fitBounds`, `onLoad`) debe activar estado de espera de cámara para overlays de alta prominencia (ej. dropdown de filtros).
- La espera se libera al recibir señal de viewport asentado (nonce/evento equivalente).
- Debe existir fallback timeout de seguridad para evitar deadlock visual.
- Objetivo UX: evitar que controles reaparezcan durante movimiento de cámara y produzcan ruido/lectura ambigua.

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
- `docs/contracts/explore/SELECTION_DOMINANCE_RULES.md`
- `docs/bitacora/2026/02/153-filtros-saved-visited-reencuadre-ciclico.md`
- `docs/bitacora/2026/02/176-pin-status-cross-filter-auto-switch-continuity.md`
- `docs/bitacora/2026/02/179-filter-reframe-deferred-after-load.md`
- `docs/bitacora/2026/03/242-filtro-dropdown-y-retardo-hasta-settle-de-camara.md`
