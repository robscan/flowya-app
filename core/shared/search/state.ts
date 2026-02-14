/**
 * core/shared/search/state.ts — Tipos canónicos de SearchState.
 * Fuente: contracts/shared/SEARCH_STATE.md
 */

/** Snapshot del viewport del mapa (usado en SearchContext). */
export type MapViewportSnapshot = {
  center: { lat: number; lng: number };
  zoom: number;
  bounds?: { north: number; south: number; east: number; west: number };
};

export type SearchContext =
  | { module: "explore"; viewport?: MapViewportSnapshot }
  | { module: "flow"; routeId?: string; viewport?: MapViewportSnapshot }
  | { module: "remember"; timeRange?: { fromISO: string; toISO: string } }
  | { module: "unknown" };

export type SearchStage = "idle" | "viewport" | "expanded" | "global";

export type SearchStatus = "closed" | "open";

export type SearchLoadState =
  | { kind: "idle" }
  | { kind: "loading"; startedAtMs: number }
  | { kind: "error"; message: string; code?: string; atMs: number };

export type SearchCursor =
  | { kind: "none" }
  | { kind: "offset"; value: number }
  | { kind: "opaque"; value: string };

export type SearchResultKind = "spot" | "place" | "query-suggestion";

export type SearchResultBase = {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle?: string;
  score?: number;
  source?: string;
};

export type SpotResult = SearchResultBase & {
  kind: "spot";
  spotId: string;
  coords: { lat: number; lng: number };
  isHidden?: boolean;
  saved?: boolean;
  visited?: boolean;
};

export type PlaceResult = SearchResultBase & {
  kind: "place";
  placeId: string;
  coords: { lat: number; lng: number };
};

export type QuerySuggestionResult = SearchResultBase & {
  kind: "query-suggestion";
  query: string;
};

export type SearchResult = SpotResult | PlaceResult | QuerySuggestionResult;

export type SearchSection =
  | { id: "spots"; title?: string; items: SpotResult[] }
  | { id: "places"; title?: string; items: PlaceResult[] }
  | { id: "suggestions"; title?: string; items: QuerySuggestionResult[] };

export type CachePolicy = {
  enabled: boolean;
  ttlMs: number;
  maxEntries: number;
};

export type SoftDeleteInvalidation = {
  hiddenSpotIds: Set<string>;
  updatedAtMs: number;
};

export type SearchState = {
  status: SearchStatus;
  context: SearchContext;

  query: string;
  stage: SearchStage;

  results: SearchResult[];
  sections: SearchSection[];

  cursor: SearchCursor;
  hasMore: boolean;

  load: SearchLoadState;

  cachePolicy: CachePolicy;
  softDeleteInvalidation: SoftDeleteInvalidation;

  lastSelected?: { kind: SearchResultKind; id: string; atMs: number };
};
