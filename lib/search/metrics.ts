type SearchMetricsState = {
  searchesStarted: number;
  searchNoResults: number;
  spotClicks: number;
  externalClicks: number;
  createFromSearchSuccess: number;
  createFromSearchError: number;
  externalFetchTotal: number;
  externalFetchErrors: number;
  externalFetchLastDurationMs: number | null;
  externalFetchAvgDurationMs: number | null;
  updatedAt: string | null;
};

const state: SearchMetricsState = {
  searchesStarted: 0,
  searchNoResults: 0,
  spotClicks: 0,
  externalClicks: 0,
  createFromSearchSuccess: 0,
  createFromSearchError: 0,
  externalFetchTotal: 0,
  externalFetchErrors: 0,
  externalFetchLastDurationMs: null,
  externalFetchAvgDurationMs: null,
  updatedAt: null,
};

function exposeToGlobal(): void {
  if (typeof globalThis === "undefined") return;
  try {
    (globalThis as Record<string, unknown>).__flowyaSearchMetrics = {
      ...state,
      ctrUseful:
        state.searchesStarted > 0
          ? (state.spotClicks + state.externalClicks) / state.searchesStarted
          : 0,
      noResultsRate:
        state.searchesStarted > 0
          ? state.searchNoResults / state.searchesStarted
          : 0,
      createFromSearchSuccessRate:
        state.createFromSearchSuccess + state.createFromSearchError > 0
          ? state.createFromSearchSuccess /
            (state.createFromSearchSuccess + state.createFromSearchError)
          : 0,
    };
  } catch {
    // ignore exposure errors
  }
}

function touch(): void {
  state.updatedAt = new Date().toISOString();
  exposeToGlobal();
}

export function recordSearchStarted(): void {
  state.searchesStarted += 1;
  touch();
}

export function recordSearchNoResults(): void {
  state.searchNoResults += 1;
  touch();
}

export function recordSearchSpotClick(): void {
  state.spotClicks += 1;
  touch();
}

export function recordSearchExternalClick(): void {
  state.externalClicks += 1;
  touch();
}

export function recordCreateFromSearchResult(success: boolean): void {
  if (success) state.createFromSearchSuccess += 1;
  else state.createFromSearchError += 1;
  touch();
}

export function recordExternalFetchMetric(durationMs: number, isError: boolean): void {
  state.externalFetchTotal += 1;
  if (isError) state.externalFetchErrors += 1;
  state.externalFetchLastDurationMs = durationMs;
  const prevCount = state.externalFetchTotal - 1;
  const prevAvg = state.externalFetchAvgDurationMs ?? 0;
  state.externalFetchAvgDurationMs =
    prevCount <= 0 ? durationMs : (prevAvg * prevCount + durationMs) / state.externalFetchTotal;
  touch();
}

export function getSearchMetricsSnapshot(): SearchMetricsState {
  return { ...state };
}
