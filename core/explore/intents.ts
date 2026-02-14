/**
 * core/explore/intents.ts — Tipos de intents para Explore.
 * Fuente: contracts/explore/EXPLORE_INTENTS.md
 */

import type { MapViewportSnapshot, PinFilter } from "./state";
import type { CreateFromNoResultsSeed } from "../shared/search";

export type ExploreIntent =
  | { type: "EXPLORE/VIEWPORT_CHANGED"; viewport: MapViewportSnapshot; reason?: "gesture" | "programmatic" }
  | { type: "EXPLORE/MAP_GESTURE_START" }
  | { type: "EXPLORE/TAP_PIN"; spotId: string }
  | { type: "EXPLORE/TAP_MAP"; coords: { lat: number; lng: number } }
  | { type: "EXPLORE/LONG_PRESS_MAP"; coords: { lat: number; lng: number } }
  | { type: "EXPLORE/OPEN_SEARCH" }
  | { type: "EXPLORE/CLOSE_SEARCH" }
  | { type: "EXPLORE/OPEN_SPOT"; spotId: string }
  | { type: "EXPLORE/CLOSE_SPOT" }
  | { type: "EXPLORE/DISMISS_OVERLAY" }
  | { type: "EXPLORE/SET_PIN_FILTER"; filter: PinFilter }
  | { type: "EXPLORE/START_CREATE_FROM_NO_RESULTS"; seed: CreateFromNoResultsSeed }
  | { type: "EXPLORE/START_CREATE_FROM_LONG_PRESS"; coords: { lat: number; lng: number } }
  | { type: "EXPLORE/MOVE_DRAFT_PIN"; coords: { lat: number; lng: number } }
  | { type: "EXPLORE/CONFIRM_DRAFT_LOCATION" }
  | { type: "EXPLORE/SET_DRAFT_COVER_URI"; uri: string }
  | { type: "EXPLORE/SUBMIT_DRAFT_CREATE"; draftId: string }
  | { type: "EXPLORE/SPOT_HIDDEN"; spotId: string; atMs?: number }
  | { type: "EXPLORE/SPOT_RESTORED"; spotId: string; atMs?: number };
