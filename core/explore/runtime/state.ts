import type { PinFilter } from "../state";

export type ExploreSheetState = "peek" | "medium" | "expanded";

export type ExploreRuntimeState = {
  pinFilter: PinFilter;
  sheetState: ExploreSheetState;
};

export const INITIAL_EXPLORE_RUNTIME_STATE: ExploreRuntimeState = {
  pinFilter: "all",
  sheetState: "peek",
};
