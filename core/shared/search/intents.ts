/**
 * core/shared/search/intents.ts — Tipos de intents para Search.
 * Fuente: docs/contracts/shared/SEARCH_INTENTS.md
 */

import type { SearchContext, SearchResult } from "./state";

export type CreateFromNoResultsSeed =
  | { kind: "coords"; coords: { lat: number; lng: number }; query?: string }
  | { kind: "place"; placeId: string; coords: { lat: number; lng: number }; query?: string };

export type SearchIntent =
  | { type: "SEARCH/SET_CONTEXT"; context: SearchContext }
  | { type: "SEARCH/OPEN" }
  | { type: "SEARCH/CLOSE" }
  | { type: "SEARCH/SET_QUERY"; query: string; reason?: "typing" | "paste" | "suggestion" }
  | { type: "SEARCH/CLEAR_QUERY" }
  | { type: "SEARCH/SUBMIT"; query?: string }
  | { type: "SEARCH/FETCH_MORE" }
  | { type: "SEARCH/SELECT_RESULT"; result: SearchResult }
  | { type: "SEARCH/CREATE_FROM_NO_RESULTS"; seed: CreateFromNoResultsSeed }
  | { type: "SEARCH/INVALIDATE_SOFT_DELETED"; hiddenSpotId: string; atMs?: number };
