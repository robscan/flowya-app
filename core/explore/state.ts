/**
 * core/explore/state.ts — Tipos canónicos de ExploreState.
 * Fuente: contracts/explore/EXPLORE_STATE.md
 */

export type MapViewportSnapshot = {
  center: { lat: number; lng: number };
  zoom: number;
  bounds?: { north: number; south: number; east: number; west: number };
};

export type PinFilter = "all" | "saved" | "visited";

export type OverlayMode = "none" | "search" | "spot" | "create";

export type SheetMode = "hidden" | "peek" | "medium" | "expanded";

export type ExploreSpotKind = "persisted" | "draft";

export type ExploreSpotLite = {
  kind: ExploreSpotKind;
  id: string;
  title?: string;
  coords: { lat: number; lng: number };
  coverUri?: string;
  isHidden?: boolean;
  saved?: boolean;
  visited?: boolean;
};

export type CreateDraftState =
  | { kind: "none" }
  | {
      kind: "placing";
      draft: ExploreSpotLite & { kind: "draft" };
      step: "pin" | "details";
      coverUri?: string;
    }
  | {
      kind: "submitting";
      draftId: string;
      startedAtMs: number;
    };

export type ExploreLoadState =
  | { kind: "idle" }
  | { kind: "loading"; startedAtMs: number }
  | { kind: "error"; message: string; code?: string; atMs: number };

export type ExploreState = {
  viewport: MapViewportSnapshot;

  spots: ExploreSpotLite[];
  displayedSpots: ExploreSpotLite[];

  selectedSpotId: string | null;

  overlayMode: OverlayMode;
  sheetMode: SheetMode;

  pinFilter: PinFilter;

  createDraft: CreateDraftState;

  auth: { isAuthed: boolean };

  load: ExploreLoadState;
};
