# 273 — Sticky Context + visibilidad temporal canónica para spots core

Fecha: 2026-03-02  
Tipo: Runtime policy + Map layer integration + UX hardening  
Área: `core/explore/runtime/*`, `components/explorar/MapScreenVNext.tsx`, `lib/map-core/spots-layer.ts`

## Contexto

Persistía un bug crítico en spots creados por usuario (no enlazados): al mutar estado y remover filtro, algunos desaparecían o forzaban cambios de filtro que rompían flujo por lote.

## Decisión cerrada

- Política global de transición: `Sticky Context`.
- Ninguna mutación de estado cambia filtro automáticamente.
- Se agrega excepción temporal de visibilidad para spot mutado reciente (TTL 10s) para evitar desaparición percibida.

## Cambios implementados

1. Runtime explícito
- `ExploreRuntimeState` agrega:
  - `recentlyMutatedSpotId`
  - `recentMutationUntil`
  - `recentMutationOriginFilter`
- Nuevos intents/reducer:
  - `SET_RECENT_MUTATION`
  - `CLEAR_RECENT_MUTATION`
- Nueva política:
  - `resolveFilterTransitionPolicy(...)` en `core/explore/runtime/transitions.ts`.

2. MapScreenVNext
- `handleSavePin` delega transición de filtro a policy `sticky`.
- Se elimina autoswitch de filtro en transiciones `to_visit/visited/clear`.
- Se mantiene selección y sheet `medium` tras mutación.
- Se registra mutación reciente con TTL (`RECENT_MUTATION_TTL_MS = 10000`).
- `displayedSpots` aplica excepción canónica para el spot mutado reciente.
- Se limpia excepción por TTL o por cambio de selección.

3. Integración con capa Mapbox
- `SpotForLayer` agrega `forceVisible?: boolean`.
- GeoJSON de `spots-layer` expone `forceVisible`.
- Filtros de default no enlazado permiten bypass de zoom por feature cuando `forceVisible=true`.
- `minzoom` de capas default no enlazadas pasa a 0 y el gating principal queda en filter expression (zoom o `forceVisible`) para evitar artefactos.

## Guardrails

- Excepción temporal limitada a 1 spot.
- Spot default enlazado a POI no persiste por excepción si no está seleccionado.
- Filtro activo permanece estable durante trabajo por lote.

## Resultado esperado

- El spot core no desaparece al limpiar `visited`/`to_visit`.
- En flujos por lote (`Por visitar` -> marcar visitados), no hay secuestro de contexto.
- Zoom out mantiene limpieza visual sin contornos residuales por reglas inconsistentes.
