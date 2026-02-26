# FILTER_RUNTIME_RULES

Reglas runtime de filtros de pines (`Todos`, `Por visitar`, `Visitados`).

## Scope

- Selección de filtro.
- Badge de pendiente de lectura.
- Estado vacío y deshabilitado.
- Persistencia local de pendientes.

## Reglas canónicas

1. **Filtros disponibles**
- `all`, `saved`, `visited`.
- Si `saved`/`visited` tienen `count=0`, opción deshabilitada y sin número.

2. **Pendientes de lectura**
- El estado pendiente es por filtro (no monovalor): `saved` y `visited` pueden coexistir.
- Si usuario está en `Todos` y muta estado desde sheet:
  - activar pendiente en filtro destino.
- Si usuario toca otro filtro distinto al pendiente:
  - no limpiar pendiente ajeno.
- Se limpia solo cuando:
  - usuario selecciona ese filtro, o
  - el count de ese filtro llega a `0`.

3. **Persistencia local**
- Pendientes se guardan localmente y sobreviven recarga/sesión local.
- Persistencia por objeto completo `{ saved, visited }` para evitar sobrescritura parcial.

4. **Acción de reset**
- En `saved/visited`, trigger muestra `X` para volver a `Todos`.
- En web no se permite `button` dentro de `button` (overlay táctil hermano).

## Core puro recomendado

- `reducePendingBadges(prev, event) => next`
- `getFilterAvailability(counts) => { savedDisabled, visitedDisabled }`

## Adapter necesario

- `LocalStateAdapter.getPendingBadges()`
- `LocalStateAdapter.setPendingBadges()`

## Referencias

- `docs/contracts/MAP_PINS_CONTRACT.md`
- `docs/bitacora/2026/02/175-map-pin-filter-pending-badge-position-y-focus-spot.md`
- `docs/bitacora/2026/02/177-map-pin-filter-multi-pending-badges.md`
- `docs/bitacora/2026/02/178-map-pin-filter-pending-badges-local-persistence.md`
