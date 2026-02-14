/**
 * core/explore — Módulo Explore (estado + intents + efectos).
 * TODO: Extraer de MapScreenVNext + useMapCore.
 */

export type {
  ExploreState,
  MapViewportSnapshot,
  PinFilter,
  OverlayMode,
  SheetMode,
  ExploreSpotLite,
  CreateDraftState,
  ExploreLoadState,
} from "./state";

export type { ExploreIntent } from "./intents";

export type {
  SpotsRepo,
  MapAdapter,
  MediaUploadAdapter,
  AuthGateAdapter,
  ExploreEffects,
} from "./effects";
