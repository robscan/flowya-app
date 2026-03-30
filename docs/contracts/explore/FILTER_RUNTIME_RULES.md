# FILTER_RUNTIME_RULES

Reglas runtime de filtros de pines (`Todos`, `Por visitar`, `Visitados`).

## Scope

- Selección de filtro.
- Persistencia de preferencia de filtro.
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

4. **Persistencia local de preferencia (`pinFilter`)**
- La última selección (`all` | `saved` | `visited`) se persiste por dispositivo usando `mapPinFilterPreference`.
- Web: lectura síncrona en boot.
- Nativo: hidratación asíncrona en mount.
- Guardrail: en nativo no escribir la preferencia antes de completar la hidratación inicial, para no sobrescribir con default `all`.
- APIs públicas:
  - `getMapPinFilterPreference()` (sync; web efectiva, nativo devuelve default hasta hidratar),
  - `loadMapPinFilterPreferenceAsync()` (source of truth en nativo),
  - `setMapPinFilterPreference(next)` (persistencia best-effort, sin throw).
- Clave de storage: `flowya_map_pin_filter_preference`.

5. **Persistencia local de pendientes**
- Pendientes se guardan localmente y sobreviven recarga/sesión local.
- Persistencia por objeto completo `{ saved, visited }` para evitar sobrescritura parcial.
- APIs públicas:
  - `getMapPinPendingBadges()` / `loadMapPinPendingBadgesAsync()`,
  - `setMapPinPendingBadges({ saved, visited })`.
- Clave de storage: `flowya_map_pin_pending_badges`.

6. **Acción de reset**
- En `saved/visited`, trigger muestra `X` para volver a `Todos`.
- En web no se permite `button` dentro de `button` (overlay táctil hermano).

7. **Dropdown positioning + visibilidad contextual (2026-03)**
- El trigger de filtro se ancla respecto al sheet activo para mantener continuidad visual (no flotar arbitrario).
- La apertura del menú debe resolverse dinámicamente (`up/down`) según espacio disponible por encima/debajo del trigger.
- El dropdown no debe renderizarse cuando:
  - `Search` está abierto,
  - `Create Spot Paso 0` está abierto,
  - la cámara está en transición programática y aún no se considera estable.

8. **Retardo de aparición post-cámara (2026-03)**
- Tras `flyTo/fitBounds/load`, el dropdown espera settle de cámara antes de reaparecer.
- Debe existir fallback timeout para evitar bloqueo permanente si el evento de settle no llega.
- La primera aparición puede usar delay corto para suavizar lectura; reapariciones subsecuentes no deben introducir latencia excesiva.

9. **Estado de spot explícito (SpotSheet, 2026-03-01)**
- El cambio de estado en sheet no debe depender de transición implícita secuencial.
- Deben existir dos acciones explícitas:
  - `Por visitar` (toggle on/off),
  - `Visitado` (toggle on/off).
- Al activar `Visitado`, prevalece sobre `Por visitar` (normalización de estado).
- Al desactivar el estado activo dentro de un filtro (`saved` o `visited`), el spot sale de esa lista y la vista permanece en el filtro actual.

10. **Sticky Context (2026-03-02, cierre definitivo)**
- Política canónica de transición de filtro: `sticky`.
- Al mutar estado (`default ↔ to_visit ↔ visited`), el filtro activo no cambia automáticamente.
- La navegación entre filtros es explícita por acción de usuario (pills/dropdown), no por side effects de guardado.
- Se permite feedback textual con CTA sugerido (`Ver Visitados`, `Ver Por visitar`, `Ver Todos`) sin auto-switch.

11. **Excepción temporal de visibilidad post-mutación**
- Runtime mantiene `recentlyMutatedSpotId`, `recentMutationUntil` y `recentMutationOriginFilter`.
- El spot mutado reciente se mantiene visible temporalmente (TTL canónico: `10s`) para evitar desaparición percibida.
- La excepción es de un solo spot (última mutación gana).
- Si el spot default está enlazado a POI Mapbox, la excepción no persiste fuera de selección activa.
- Source of truth TTL: `RECENT_MUTATION_TTL_MS = 10_000` en `core/explore/runtime/state.ts`.

## Troubleshooting

1. **En nativo siempre vuelve a `Todos` al reabrir**
- Verificar que se hidrate `mapPinFilterPreference` al montar.
- Confirmar que la escritura de preferencia no ocurra antes de terminar la hidratación inicial.
- Validar que `pinFilterStorageReady` pase a `true` incluso si falla lectura de AsyncStorage (guardrail anti-lock).

2. **`saved`/`visited` aparece vacío tras deep link o post-edit**
- Comportamiento esperado: no hay auto-switch a `all`.
- Revisar la excepción temporal de visibilidad (`recentlyMutatedSpotId` + TTL).

3. **Badges pendientes se pisan entre filtros**
- Verificar persistencia como objeto completo `{ saved, visited }`, no escrituras parciales por clave.

4. **Filtro no persiste en web (modo privado / bloqueo storage)**
- Comportamiento esperado: fallback silencioso en memoria cuando `localStorage` falla.
- Confirmar que la UI no dependa de excepciones de persistencia para actualizar estado visible.

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
