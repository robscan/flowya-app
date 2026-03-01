import type { MapPinFilterValue } from "@/components/design-system/map-pin-filter";

export type ExploreDecisionSource = "map" | "search";
export type ExploreDecisionOutcome =
  | "saved"
  | "visited"
  | "dismissed"
  | "opened_detail";
export type ExploreSelectionEntityType = "spot" | "poi";
export type ExploreSelectionState = "selected" | "cleared";

export type ExploreDecisionStartedPayload = {
  source: ExploreDecisionSource;
  pinFilter: MapPinFilterValue;
  hasSelection: boolean;
  timestampMs: number;
};

export type ExploreDecisionCompletedPayload = {
  outcome: ExploreDecisionOutcome;
  elapsedMs: number | null;
  pinFilter: MapPinFilterValue;
  timestampMs: number;
};

export type ExploreSelectionChangedPayload = {
  entityType: ExploreSelectionEntityType;
  selectionState: ExploreSelectionState;
  fromFilter: MapPinFilterValue;
  toFilter: MapPinFilterValue;
  timestampMs: number;
};

type ExploreDecisionMetricsState = {
  started: number;
  completed: number;
  selectionChanged: number;
  activeDecisionStartedAtMs: number | null;
  lastStarted: ExploreDecisionStartedPayload | null;
  lastCompleted: ExploreDecisionCompletedPayload | null;
  lastSelectionChanged: ExploreSelectionChangedPayload | null;
  updatedAt: string | null;
};

const state: ExploreDecisionMetricsState = {
  started: 0,
  completed: 0,
  selectionChanged: 0,
  activeDecisionStartedAtMs: null,
  lastStarted: null,
  lastCompleted: null,
  lastSelectionChanged: null,
  updatedAt: null,
};

function touch(): void {
  state.updatedAt = new Date().toISOString();
  if (typeof globalThis === "undefined") return;
  try {
    (globalThis as Record<string, unknown>).__flowyaExploreDecisionMetrics = {
      ...state,
    };
  } catch {
    // ignore global exposure errors
  }
}

export function recordExploreDecisionStarted(
  payload: Omit<ExploreDecisionStartedPayload, "timestampMs"> & {
    timestampMs?: number;
  },
): void {
  const timestampMs = payload.timestampMs ?? Date.now();
  state.started += 1;
  state.activeDecisionStartedAtMs = timestampMs;
  state.lastStarted = {
    source: payload.source,
    pinFilter: payload.pinFilter,
    hasSelection: payload.hasSelection,
    timestampMs,
  };
  touch();
}

export function recordExploreDecisionCompleted(
  payload: Omit<ExploreDecisionCompletedPayload, "elapsedMs" | "timestampMs"> & {
    timestampMs?: number;
  },
): void {
  const timestampMs = payload.timestampMs ?? Date.now();
  const elapsedMs =
    state.activeDecisionStartedAtMs != null
      ? Math.max(0, timestampMs - state.activeDecisionStartedAtMs)
      : null;
  state.completed += 1;
  state.activeDecisionStartedAtMs = null;
  state.lastCompleted = {
    outcome: payload.outcome,
    pinFilter: payload.pinFilter,
    elapsedMs,
    timestampMs,
  };
  touch();
}

export function recordExploreSelectionChanged(
  payload: Omit<ExploreSelectionChangedPayload, "timestampMs"> & {
    timestampMs?: number;
  },
): void {
  const timestampMs = payload.timestampMs ?? Date.now();
  state.selectionChanged += 1;
  state.lastSelectionChanged = {
    entityType: payload.entityType,
    selectionState: payload.selectionState,
    fromFilter: payload.fromFilter,
    toFilter: payload.toFilter,
    timestampMs,
  };
  touch();
}

export function getExploreDecisionMetricsSnapshot(): ExploreDecisionMetricsState {
  return { ...state };
}
