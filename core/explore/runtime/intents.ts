import type { PinFilter } from "../state";
import type { ExploreRuntimeState, ExploreSheetState } from "./state";

export type ExploreIntent =
  | { type: "EXPLORE_RUNTIME/SET_PIN_FILTER"; filter: PinFilter }
  | { type: "EXPLORE_RUNTIME/SET_SHEET_STATE"; sheetState: ExploreSheetState }
  | {
      type: "EXPLORE_RUNTIME/SET_RECENT_MUTATION";
      spotId: string;
      until: number;
      originFilter: PinFilter;
    }
  | { type: "EXPLORE_RUNTIME/CLEAR_RECENT_MUTATION" }
  | { type: "EXPLORE_RUNTIME/RESET"; state?: Partial<ExploreRuntimeState> };
