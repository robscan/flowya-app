export type CountriesQuality = "high" | "medium" | "low";

export type ActivitySummaryCountrySource =
  | "spot_country_code"
  | "linked_country_code"
  | "linked_country_name"
  | "address_heuristic_v1";

export type ActivitySummarySpotInput = {
  address?: string | null;
  countryCode?: string | null;
  linkedCountryCode?: string | null;
  linkedCountryName?: string | null;
};

export type CountriesEvaluation = {
  count: number | null;
  coverage: number;
  detected: number;
  total: number;
  quality: CountriesQuality;
  sourcePriorityUsed: ActivitySummaryCountrySource[];
};

const COUNTRY_MIN_COVERAGE_RATIO = 0.4;
const COUNTRY_HIGH_COVERAGE_RATIO = 0.8;

const NON_COUNTRY_ADDRESS_TOKENS = new Set([
  "centro",
  "downtown",
  "unknown",
  "sin direccion",
  "sin dirección",
  "n/a",
  "na",
]);

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeIsoCountryCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  return code;
}

function extractCountryFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const candidate = parts[parts.length - 1] ?? "";
  const normalized = normalizeText(candidate);
  if (!normalized) return null;
  if (NON_COUNTRY_ADDRESS_TOKENS.has(normalized)) return null;
  if (/\d/.test(normalized)) return null;
  if (normalized.length < 2) return null;
  return normalized;
}

function resolveCountryKeyForSpot(spot: ActivitySummarySpotInput): {
  key: string | null;
  source: ActivitySummaryCountrySource | null;
} {
  const countryCode = normalizeIsoCountryCode(spot.countryCode);
  if (countryCode) return { key: `iso:${countryCode}`, source: "spot_country_code" };

  const linkedCountryCode = normalizeIsoCountryCode(spot.linkedCountryCode);
  if (linkedCountryCode) {
    return { key: `iso:${linkedCountryCode}`, source: "linked_country_code" };
  }

  if (spot.linkedCountryName) {
    const normalizedName = normalizeText(spot.linkedCountryName);
    if (normalizedName) {
      return { key: `name:${normalizedName}`, source: "linked_country_name" };
    }
  }

  const fromAddress = extractCountryFromAddress(spot.address);
  if (fromAddress) {
    return { key: `name:${fromAddress}`, source: "address_heuristic_v1" };
  }

  return { key: null, source: null };
}

function resolveCountriesQuality(coverage: number): CountriesQuality {
  if (coverage < COUNTRY_MIN_COVERAGE_RATIO) return "low";
  if (coverage < COUNTRY_HIGH_COVERAGE_RATIO) return "medium";
  return "high";
}

export function evaluateVisitedCountries(
  spots: ActivitySummarySpotInput[],
): CountriesEvaluation {
  const total = spots.length;
  if (total === 0) {
    return {
      count: 0,
      coverage: 1,
      detected: 0,
      total: 0,
      quality: "high",
      sourcePriorityUsed: [],
    };
  }

  const keys = new Set<string>();
  const sourceSet = new Set<ActivitySummaryCountrySource>();
  let detected = 0;

  for (const spot of spots) {
    const resolved = resolveCountryKeyForSpot(spot);
    if (!resolved.key || !resolved.source) continue;
    detected += 1;
    keys.add(resolved.key);
    sourceSet.add(resolved.source);
  }

  const coverage = detected / total;
  const quality = resolveCountriesQuality(coverage);
  const count = quality === "low" ? null : keys.size;

  return {
    count,
    coverage,
    detected,
    total,
    quality,
    sourcePriorityUsed: [...sourceSet],
  };
}

export const ACTIVITY_SUMMARY_COUNTRIES_POLICY = {
  minCoverageToShow: COUNTRY_MIN_COVERAGE_RATIO,
  highCoverageThreshold: COUNTRY_HIGH_COVERAGE_RATIO,
} as const;
