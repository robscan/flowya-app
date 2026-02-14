/**
 * core/explore/effects.ts — Interfaces de adapters para Explore.
 * Fuente: contracts/explore/EXPLORE_EFFECTS.md
 */

import type { ExploreSpotLite, MapViewportSnapshot } from "./state";

export interface SpotsRepo {
  fetchSpots(args: {
    viewport?: MapViewportSnapshot;
    includeHidden?: boolean;
  }): Promise<ExploreSpotLite[]>;

  insertSpot(args: {
    coords: { lat: number; lng: number };
    title?: string;
    descriptionShort?: string;
    descriptionLong?: string;
    coverUri?: string;
  }): Promise<{ spotId: string }>;

  updateSpotHidden(args: { spotId: string; isHidden: boolean }): Promise<void>;
}

export interface MapAdapter {
  getViewport(): Promise<MapViewportSnapshot>;

  getBounds(): Promise<MapViewportSnapshot["bounds"] | undefined>;

  flyTo(args: {
    center: { lat: number; lng: number };
    zoom?: number;
  }): Promise<void>;

  getSelectedPinScreenPos(args: {
    spotId: string;
  }): Promise<{ x: number; y: number } | null>;
}

export interface MediaUploadAdapter {
  uploadSpotCover(args: { spotId: string; uri: string }): Promise<{
    publicUrl: string;
  }>;
}

export interface AuthGateAdapter {
  requireAuth(): Promise<
    | { ok: true }
    | { ok: false; reason: "not_authed" }
  >;
}

export type ExploreEffects = {
  spotsRepo: SpotsRepo;
  map: MapAdapter;
  media: MediaUploadAdapter;
  auth: AuthGateAdapter;
};
