import type { ExploreRuntimeState } from "./state";

export type ExploreInvariantResult =
  | { ok: true }
  | { ok: false; reason: string };

const PIN_FILTERS = new Set(["all", "saved", "visited"]);
const SHEET_STATES = new Set(["peek", "medium", "expanded"]);

export function validateExploreRuntimeState(
  state: ExploreRuntimeState,
): ExploreInvariantResult {
  if (!PIN_FILTERS.has(state.pinFilter)) {
    return { ok: false, reason: `Invalid pinFilter: ${String(state.pinFilter)}` };
  }
  if (!SHEET_STATES.has(state.sheetState)) {
    return {
      ok: false,
      reason: `Invalid sheetState: ${String(state.sheetState)}`,
    };
  }
  if (
    state.recentMutationOriginFilter != null &&
    !PIN_FILTERS.has(state.recentMutationOriginFilter)
  ) {
    return {
      ok: false,
      reason: `Invalid recentMutationOriginFilter: ${String(state.recentMutationOriginFilter)}`,
    };
  }
  if (
    (state.recentlyMutatedSpotId == null) !== (state.recentMutationUntil == null)
  ) {
    return {
      ok: false,
      reason: "recentlyMutatedSpotId and recentMutationUntil must be both set or both null",
    };
  }
  return { ok: true };
}
