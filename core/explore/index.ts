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

export type {
  ExploreRuntimeState,
  ExploreSheetState,
  ExploreReducer as ExploreRuntimeReducer,
  ExploreInvariantResult,
  PinStatusTransition,
  CountriesQuality,
  ActivitySummaryCountrySource,
  ActivitySummarySpotInput,
  CountriesEvaluation,
} from "./runtime";

export {
  INITIAL_EXPLORE_RUNTIME_STATE,
  exploreRuntimeReducer,
  validateExploreRuntimeState,
  resolveDestinationFilterForStatus,
  shouldClearSelectedSpotOnFilterChange,
  shouldRestoreSelectionOnSearchClose,
  shouldMarkPendingBadge,
  shouldSwitchFilterOnStatusTransition,
  shouldPulseFilterOnStatusTransition,
  evaluateVisitedCountries,
  ACTIVITY_SUMMARY_COUNTRIES_POLICY,
} from "./runtime";
