import type { PinFilter } from "../state";
import type { ExploreRuntimeState, ExploreSheetState } from "./state";

export type ExploreIntent =
  | { type: "EXPLORE_RUNTIME/SET_PIN_FILTER"; filter: PinFilter }
  | { type: "EXPLORE_RUNTIME/SET_SHEET_STATE"; sheetState: ExploreSheetState }
  | { type: "EXPLORE_RUNTIME/RESET"; state?: Partial<ExploreRuntimeState> };
