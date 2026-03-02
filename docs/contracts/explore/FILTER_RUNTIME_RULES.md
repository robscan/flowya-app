# FILTER_RUNTIME_RULES

Reglas runtime de filtros de pines (`Todos`, `Por visitar`, `Visitados`).

## Scope

- Selección de filtro.
- Badge de pendiente de lectura.
- Estado vacío y deshabilitado.
- Persistencia local de pendientes.

## Reglas canónicas

0. **Intención explícita (OL-WOW-F2-003)**
- Filtros comunicados como guía, no switch técnico: intención por filtro.
- `Todos`: "Explora y decide"; `Por visitar`: "Planifica lo próximo"; `Visitados`: "Recuerda lo vivido".
- Al seleccionar filtro en dropdown del mapa: toast con mensaje de intención.
- Matiz contextual 2026-03-01:
  - si el usuario viene desde `all`, el toast invita a actuar sobre el nuevo filtro;
  - si ya estaba en un filtro (`saved`/`visited`), el toast recuerda explícitamente el contexto actual.
- MapPinFilterInline (buscador): sin subtítulos para no saturar.
- MapPinFilter: a11y incluye intención; en futuro se evaluará comportamiento adaptativo.

1. **Filtros disponibles**
- `all`, `saved`, `visited`.
- Si `saved`/`visited` tienen `count=0`, opción deshabilitada y sin número.

2. **Pending-first navigation (OL-WOW-F2-003)**
- Si hay badge pendiente en `saved` o `visited`, al entrar a ese filtro: seleccionar ese spot, abrir sheet `medium`, centrar mapa.
- Comportamiento estable y predecible; usuario evita buscar manualmente. Referencia: bitácora `175`.

3. **Pendientes de lectura**
- El estado pendiente es por filtro (no monovalor): `saved` y `visited` pueden coexistir.
- Si usuario está en `Todos` y muta estado desde sheet:
  - activar pendiente en filtro destino.
- Si usuario toca otro filtro distinto al pendiente:
  - no limpiar pendiente ajeno.
- Se limpia solo cuando:
  - usuario selecciona ese filtro, o
  - el count de ese filtro llega a `0`.

4. **Persistencia local**
- Pendientes se guardan localmente y sobreviven recarga/sesión local.
- Persistencia por objeto completo `{ saved, visited }` para evitar sobrescritura parcial.

5. **Acción de reset**
- En `saved/visited`, trigger muestra `X` para volver a `Todos`.
- En web no se permite `button` dentro de `button` (overlay táctil hermano).

6. **Dropdown positioning + visibilidad contextual (2026-03)**
- El trigger de filtro se ancla respecto al sheet activo para mantener continuidad visual (no flotar arbitrario).
- La apertura del menú debe resolverse dinámicamente (`up/down`) según espacio disponible por encima/debajo del trigger.
- El dropdown no debe renderizarse cuando:
  - `Search` está abierto,
  - `Create Spot Paso 0` está abierto,
  - la cámara está en transición programática y aún no se considera estable.

7. **Retardo de aparición post-cámara (2026-03)**
- Tras `flyTo/fitBounds/load`, el dropdown espera settle de cámara antes de reaparecer.
- Debe existir fallback timeout para evitar bloqueo permanente si el evento de settle no llega.
- La primera aparición puede usar delay corto para suavizar lectura; reapariciones subsecuentes no deben introducir latencia excesiva.

8. **Estado de spot explícito (SpotSheet, 2026-03-01)**
- El cambio de estado en sheet no debe depender de transición implícita secuencial.
- Deben existir dos acciones explícitas:
  - `Por visitar` (toggle on/off),
  - `Visitado` (toggle on/off).
- Al activar `Visitado`, prevalece sobre `Por visitar` (normalización de estado).
- Al desactivar el estado activo dentro de un filtro (`saved` o `visited`), el spot sale de esa lista y la vista permanece en el filtro actual.

## Core puro recomendado

- `reducePendingBadges(prev, event) => next`
- `getFilterAvailability(counts) => { savedDisabled, visitedDisabled }`

## Adapter necesario

- `LocalStateAdapter.getPendingBadges()`
- `LocalStateAdapter.setPendingBadges()`

## Referencias

- `docs/contracts/MAP_PINS_CONTRACT.md`
- `docs/bitacora/2026/02/095-pins-por-visitar-y-map-pin-filter-dropdown.md`
- `docs/bitacora/2026/02/175-map-pin-filter-pending-badge-position-y-focus-spot.md`
- `docs/bitacora/2026/02/177-map-pin-filter-multi-pending-badges.md`
- `docs/bitacora/2026/02/178-map-pin-filter-pending-badges-local-persistence.md`
- `docs/bitacora/2026/03/242-filtro-dropdown-y-retardo-hasta-settle-de-camara.md`
