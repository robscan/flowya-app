# EXPLORE_INTENTS

## Purpose
Definir las **intenciones** (eventos semánticos) para que cualquier shell (web/nativo) controle Explore sin conocer implementación.

## Scope
- Eventos de mapa (tap pin, tap map, long press, viewport changes)
- Coordinación de overlays/sheets
- Create spot inline (draft) + handoff a wizard
- Hooks por soft delete/visibility

## Non-goals
- Implementar side effects (fetch, flyTo, persist) — ver `EXPLORE_EFFECTS`.
- Reglas de gestos/animación.

## Contract

### Tipos (pseudo-TypeScript)

```ts
type ExploreIntent =
  // Map + viewport
  | { type: "EXPLORE/VIEWPORT_CHANGED"; viewport: MapViewportSnapshot; reason?: "gesture"|"programmatic" }
  | { type: "EXPLORE/MAP_GESTURE_START" }
  | { type: "EXPLORE/TAP_PIN"; spotId: string }
  | { type: "EXPLORE/TAP_MAP"; coords: { lat: number; lng: number } }
  | { type: "EXPLORE/LONG_PRESS_MAP"; coords: { lat: number; lng: number } }

  // Overlay coordination
  | { type: "EXPLORE/OPEN_SEARCH" }
  | { type: "EXPLORE/CLOSE_SEARCH" }
  | { type: "EXPLORE/OPEN_SPOT"; spotId: string }
  | { type: "EXPLORE/CLOSE_SPOT" }
  | { type: "EXPLORE/DISMISS_OVERLAY" }

  // Filters
  | { type: "EXPLORE/SET_PIN_FILTER"; filter: PinFilter }

  // Create (inline draft)
  | { type: "EXPLORE/START_CREATE_FROM_NO_RESULTS"; seed: CreateFromNoResultsSeed }
  | { type: "EXPLORE/START_CREATE_FROM_LONG_PRESS"; coords: { lat: number; lng: number } }
  | { type: "EXPLORE/MOVE_DRAFT_PIN"; coords: { lat: number; lng: number } }
  | { type: "EXPLORE/CONFIRM_DRAFT_LOCATION" }
  | { type: "EXPLORE/SET_DRAFT_COVER_URI"; uri: string }
  | { type: "EXPLORE/SUBMIT_DRAFT_CREATE"; draftId: string }

  // Visibility / soft delete signals
  | { type: "EXPLORE/SPOT_HIDDEN"; spotId: string; atMs?: number }
  | { type: "EXPLORE/SPOT_RESTORED"; spotId: string; atMs?: number };
```

## Invariants (dev-only)
1. `EXPLORE/TAP_PIN` debe llevar a `overlayMode:"spot"` y `selectedSpotId=spotId`.
2. `EXPLORE/OPEN_SEARCH` debe llevar a `overlayMode:"search"` (y no puede dejar sheet en expanded por spot).
3. `EXPLORE/START_CREATE_FROM_NO_RESULTS` crea draft y entra a `overlayMode:"create"`.
4. `EXPLORE/MOVE_DRAFT_PIN` solo válido si `createDraft.kind==="placing"`.

## Events / Intents
Nombres estables (para logs/analytics futuros):
- `EXPLORE/VIEWPORT_CHANGED`
- `EXPLORE/MAP_GESTURE_START`
- `EXPLORE/TAP_PIN`
- `EXPLORE/TAP_MAP`
- `EXPLORE/LONG_PRESS_MAP`
- `EXPLORE/OPEN_SEARCH`
- `EXPLORE/CLOSE_SEARCH`
- `EXPLORE/OPEN_SPOT`
- `EXPLORE/CLOSE_SPOT`
- `EXPLORE/DISMISS_OVERLAY`
- `EXPLORE/SET_PIN_FILTER`
- `EXPLORE/START_CREATE_FROM_NO_RESULTS`
- `EXPLORE/START_CREATE_FROM_LONG_PRESS`
- `EXPLORE/MOVE_DRAFT_PIN`
- `EXPLORE/CONFIRM_DRAFT_LOCATION`
- `EXPLORE/SET_DRAFT_COVER_URI`
- `EXPLORE/SUBMIT_DRAFT_CREATE`
- `EXPLORE/SPOT_HIDDEN`
- `EXPLORE/SPOT_RESTORED`

## Source Mapping (today → future)
- Hoy:
  - Map interactions: `MapScreenVNext.tsx`, `useMapCore.ts`
  - Search open/close: `BottomDock.tsx`, `SearchFloating.tsx`
  - Draft flow: `handleCreateFromNoResults`, `handleCreateSpotFromDraft`, `isPlacingDraftSpot`
- Futuro:
  - Reducer/controller de Explore consume intents y emite effects.

## Open Questions
- Si “long-press” siempre va al wizard `/create-spot` o si en V3 también soportará draft inline (hoy existen ambos).
