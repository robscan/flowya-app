/**
 * core/shared/search — Search capability (shared).
 * TODO: Extraer de useSearchControllerV2 + spotsStrategy.
 */

export type {
  SearchState,
  SearchStage,
  SearchStatus,
  SearchResult,
  SearchSection,
  SearchContext,
  SearchCursor,
  CachePolicy,
  SoftDeleteInvalidation,
} from "./state";

export type { SearchIntent, CreateFromNoResultsSeed } from "./intents";

export type { SearchProvider, SearchCache, GeocodingProvider } from "./effects";

export { createMapboxGeocodingProvider } from "./providers/geocodingProvider";
