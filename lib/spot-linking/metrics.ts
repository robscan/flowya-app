import type { SpotLinkStatus } from './types';

type SpotLinkMetricsState = {
  total: number;
  linked: number;
  uncertain: number;
  unlinked: number;
  errors: number;
  lastReason: string | null;
  lastScore: number | null;
  lastDurationMs: number | null;
  updatedAt: string | null;
};

const state: SpotLinkMetricsState = {
  total: 0,
  linked: 0,
  uncertain: 0,
  unlinked: 0,
  errors: 0,
  lastReason: null,
  lastScore: null,
  lastDurationMs: null,
  updatedAt: null,
};

function exposeToGlobal(): void {
  if (typeof globalThis === 'undefined') return;
  try {
    (globalThis as Record<string, unknown>).__flowyaSpotLinkMetrics = state;
  } catch {
    // ignore global exposure errors
  }
}

export function recordSpotLinkMetric(params: {
  status: SpotLinkStatus;
  score: number | null;
  durationMs: number;
  reason: string;
  isError?: boolean;
}): void {
  state.total += 1;
  state[params.status] += 1;
  if (params.isError) state.errors += 1;
  state.lastReason = params.reason;
  state.lastScore = params.score;
  state.lastDurationMs = params.durationMs;
  state.updatedAt = new Date().toISOString();
  exposeToGlobal();

  if (__DEV__) {
    console.info('[spot-linking]', {
      status: params.status,
      score: params.score,
      durationMs: params.durationMs,
      reason: params.reason,
      totals: {
        total: state.total,
        linked: state.linked,
        uncertain: state.uncertain,
        unlinked: state.unlinked,
        errors: state.errors,
      },
    });
  }
}

export function getSpotLinkMetricsSnapshot(): SpotLinkMetricsState {
  return { ...state };
}
