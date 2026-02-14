/**
 * core/shared/search/effects.ts — Interfaces de adapters para Search.
 * Fuente: contracts/shared/SEARCH_EFFECTS.md
 */

import type {
  SearchStage,
  SearchContext,
  SearchCursor,
  SearchResult,
  MapViewportSnapshot,
} from "./state";

export interface SearchProvider {
  runSearch(args: {
    query: string;
    stage: SearchStage;
    context: SearchContext;
    cursor: SearchCursor;
    limit: number;
    viewport?: MapViewportSnapshot;
  }): Promise<{
    results: SearchResult[];
    cursor: SearchCursor;
    hasMore: boolean;
    stage: SearchStage;
  }>;
}

export interface SearchCache {
  get(key: string): SearchResult[] | null;
  set(key: string, value: SearchResult[]): void;
  clear(prefix?: string): void;
  invalidateSpotId(spotId: string): void;
}

export interface GeocodingProvider {
  resolvePlaceForCreate(args: {
    query: string;
    viewport?: MapViewportSnapshot;
  }): Promise<{
    placeId: string;
    coords: { lat: number; lng: number };
    title?: string;
  } | null>;
}
