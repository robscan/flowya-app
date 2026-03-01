import type { ExploreIntent } from "./intents";
import {
  INITIAL_EXPLORE_RUNTIME_STATE,
  type ExploreRuntimeState,
} from "./state";

export type ExploreReducer = (
  state: ExploreRuntimeState,
  intent: ExploreIntent,
) => ExploreRuntimeState;

export const exploreRuntimeReducer: ExploreReducer = (state, intent) => {
  switch (intent.type) {
    case "EXPLORE_RUNTIME/SET_PIN_FILTER":
      return { ...state, pinFilter: intent.filter };
    case "EXPLORE_RUNTIME/SET_SHEET_STATE":
      return { ...state, sheetState: intent.sheetState };
    case "EXPLORE_RUNTIME/RESET":
      return { ...INITIAL_EXPLORE_RUNTIME_STATE, ...(intent.state ?? {}) };
    default:
      return state;
  }
};
