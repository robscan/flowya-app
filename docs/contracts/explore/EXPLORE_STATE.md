# EXPLORE_STATE

## Purpose
Definir el **estado canónico** de Explore como módulo, de forma **UI-agnóstica** (web/nativo) y preparada para reutilizar en shells futuros.

## Scope
- Viewport y selección de spot
- Overlays/sheets (representados como enums neutrales)
- Filtros de pins
- Create spot (draft inline) y handoff al wizard `/create-spot`
- Integración con Search (shared) vía `overlayMode`

## Non-goals
- Componentes UI específicos (SpotSheet Reanimated, Radix Sheet, etc.)
- Implementación de Mapbox, Supabase, upload; eso vive en `EXPLORE_EFFECTS`.
- Estado de navegación (router), excepto “intención” (intent).

## Contract

### Tipos (pseudo-TypeScript)

```ts
type MapViewportSnapshot = {
  center: { lat: number; lng: number };
  zoom: number;
  bounds?: { north: number; south: number; east: number; west: number };
};

type PinFilter = "all" | "saved" | "visited";

type OverlayMode = "none" | "search" | "spot" | "create";

type SheetMode = "hidden" | "peek" | "medium" | "expanded"; // UI-agnostic

type ExploreSpotKind = "persisted" | "draft";

type ExploreSpotLite = {
  kind: ExploreSpotKind;
  id: string; // spotId or draft_xxx
  title?: string;
  coords: { lat: number; lng: number };
  coverUri?: string;
  isHidden?: boolean; // should be false; draft may omit
  saved?: boolean;
  visited?: boolean;
};

type CreateDraftState =
  | { kind: "none" }
  | {
      kind: "placing";
      draft: ExploreSpotLite & { kind: "draft" };
      // UX step inside inline flow
      step: "pin" | "details";
      // whether cover selection exists
      coverUri?: string;
    }
  | {
      kind: "submitting";
      draftId: string;
      startedAtMs: number;
    };

type ExploreLoadState =
  | { kind: "idle" }
  | { kind: "loading"; startedAtMs: number }
  | { kind: "error"; message: string; code?: string; atMs: number };

type ExploreState = {
  viewport: MapViewportSnapshot;

  // data
  spots: ExploreSpotLite[];            // base list
  displayedSpots: ExploreSpotLite[];   // filtered/derived for pins

  // selection
  selectedSpotId: string | null;

  // UI-neutral overlay coordination
  overlayMode: OverlayMode;  // none|search|spot|create
  sheetMode: SheetMode;      // hidden|peek|medium|expanded

  // filters
  pinFilter: PinFilter;

  // create flow (inline)
  createDraft: CreateDraftState;

  // auth flags (decision belongs to effects)
  auth: { isAuthed: boolean };

  // loading
  load: ExploreLoadState;
};
```

### Notas
- `spots` es la lista base (p. ej. desde Supabase). `displayedSpots` es derivado (pinFilter, isHidden, etc.).
- `selectedSpotId` referencia a un spot existente en `displayedSpots` o a un draft (bajo reglas).
- `overlayMode` coordina Search (shared) vs Spot sheet. Evita condiciones sueltas del tipo `selectedSpot && !searchOpen`.

## Invariants (dev-only)
1. **Hidden never shown:** ningún spot con `isHidden === true` puede existir en `spots` o `displayedSpots` (filtrar en repo/effects).
2. **Selection validity:** si `selectedSpotId !== null`, debe existir en `displayedSpots` **o** ser un draft vigente (`createDraft.kind !== "none"` y ids coinciden).
3. **Overlay consistency:**  
   - `overlayMode === "none"` ⇒ `sheetMode === "hidden"` y `selectedSpotId === null` y search cerrado (se valida desde integración).  
   - `overlayMode === "search"` ⇒ `sheetMode` puede ser `hidden|peek` pero nunca `expanded` por spot.  
   - `overlayMode === "spot"` ⇒ `selectedSpotId !== null`.
4. **Draft exclusivity:** solo puede existir **un** draft activo (`createDraft.kind !== "none"` implica un único draftId).
5. **Draft requires coords:** si `createDraft.kind !== "none"` entonces el draft tiene `coords` válidas.
6. **PinFilter deterministic:** `displayedSpots` debe ser función pura de (`spots`, `pinFilter`) + reglas de draft.
7. **Viewport sane:** `zoom` dentro de un rango permitido (p. ej. 0–22); `bounds` coherentes si están presentes.
8. **No loading overlap:** `load.kind === "loading"` no debe coexistir con `createDraft.kind === "submitting"` salvo un flow explícito.
9. **Soft delete invalidation:** al recibir evento de “spot hidden”, si `selectedSpotId` coincide debe limpiarse o pasar a estado estable.
10. **SheetMode reachable:** no debe existir un estado imposible (ej. `sheetMode==="expanded"` con `overlayMode==="none"`).

## Source Mapping (today → future)
- Hoy:
  - Estado principal disperso en `components/explorar/MapScreenVNext.tsx` (useState)
  - Map signals: `hooks/useMapCore.ts` + `lib/map-core/constants.ts`
  - Sheet UI: `components/explorar/SpotSheet.tsx`
- Futuro:
  - `core/explore/state.ts` implementa `ExploreState`
  - UI shells (web/nativo) consumen `ExploreState` y emiten intents.

## Open Questions
- Confirmar si `is_hidden` está presente en migraciones de DB (riesgo detectado en Fase 0).
