/**
 * Compartir tarjeta «Países visitados» (PNG): flujo canónico independiente del sheet.
 * @see docs/contracts/VISITED_COUNTRIES_SHARE_FLOW.md
 */
export type { VisitedCountriesSharePayload } from "./types";
export type { VisitedCountriesShareBaseline } from "./baseline";
export { buildVisitedCountriesShareBaselineFromSpots } from "./baseline";
export {
  warmVisitedCountriesShareCache,
  readVisitedCountriesShareCache,
  clearVisitedCountriesShareCache,
  /** @deprecated */ syncCountriesShareVisitedSession,
  /** @deprecated */ readCountriesShareVisitedSession,
  /** @deprecated */ clearCountriesShareVisitedSession,
} from "./cache";
export { shareVisitedCountriesProgress, type ShareVisitedCountriesProgressParams } from "./flow";
