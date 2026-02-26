# CONTROLS_RUNTIME_RULES

Reglas runtime de controles flotantes de mapa.

## Scope

- Prioridad y visibilidad de controles.
- Interacción con spot/POI seleccionado y sheet.
- No competencia entre controles y flujo activo.

## Reglas canónicas

1. **Control “Ver todo el mundo”**
- Mostrar cuando no hay selección activa competitiva.
- Ocultar/despriorizar cuando hay spot o POI seleccionado con sheet activa.

2. **Control de ubicación/reencuadre**
- Disponible como acción explícita del usuario.
- No debe sobrescribir encuadre de deep link o selección recién aplicada.

3. **Consistencia con sheet**
- Si sheet está en estado activo por selección, controles no deben provocar saltos contradictorios.
- Gestos de mapa y controles deben respetar contrato de estados de sheet.

## Core puro recomendado

- `resolveControlsVisibility({ hasSelectedSpot, hasTappedPoi, sheetState })`
- `canApplyWorldView({ hasActiveSelection })`

## Adapter necesario

- `MapAdapter` (acciones de cámara)
- `UIAdapter` (render/posición controles por plataforma)

## Referencias

- `docs/contracts/EXPLORE_SHEET.md`
- `docs/contracts/SPOT_SELECTION_SHEET_SIZING.md`
- `docs/bitacora/2026/02/144-poi-selection-encuadre-contextual-y-control-world.md`
