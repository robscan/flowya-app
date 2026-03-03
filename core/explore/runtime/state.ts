import type { PinFilter } from "../state";

export type ExploreSheetState = "peek" | "medium" | "expanded";
export const RECENT_MUTATION_TTL_MS = 10_000;

export type ExploreRuntimeState = {
  pinFilter: PinFilter;
  sheetState: ExploreSheetState;
  recentlyMutatedSpotId: string | null;
  recentMutationUntil: number | null;
  recentMutationOriginFilter: PinFilter | null;
};

export const INITIAL_EXPLORE_RUNTIME_STATE: ExploreRuntimeState = {
  pinFilter: "all",
  sheetState: "peek",
  recentlyMutatedSpotId: null,
  recentMutationUntil: null,
  recentMutationOriginFilter: null,
};
