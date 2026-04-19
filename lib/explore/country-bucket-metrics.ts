/**
 * Países agrupados por heurística de dirección (mismo criterio que Explore / CountriesSheet KPI).
 * Extraído de MapScreenVNext para reutilizar en perfil y mantener conteos alineados.
 */

import { getCurrentLanguage, getCurrentLocale } from "@/lib/i18n/locale-config";

export type CountryBucket = {
  key: string;
  label: string;
  count: number;
};

export type SpotForCountryBucket = {
  address: string | null | undefined;
};

const COUNTRY_ALIAS_OVERRIDES: Record<string, string> = {
  "united states of america": "US",
  "ee uu": "US",
  "u s a": "US",
  uk: "GB",
  "united kingdom": "GB",
};
const cachedCountryAliasIndexByLocale = new Map<string, Map<string, string>>();
const cachedRegionDisplayByLocale = new Map<string, Intl.DisplayNames | null>();

function normalizeCountryLabel(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "";
  const normalized = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return normalized
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeCountryToken(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.'’`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getRegionDisplay(locale: string): Intl.DisplayNames | null {
  const cached = cachedRegionDisplayByLocale.get(locale);
  if (cached !== undefined) return cached;
  try {
    const display = new Intl.DisplayNames([locale], { type: "region" });
    cachedRegionDisplayByLocale.set(locale, display);
    return display;
  } catch {
    cachedRegionDisplayByLocale.set(locale, null);
    return null;
  }
}

function buildCountryAliasIndex(locale: string): Map<string, string> {
  const cached = cachedCountryAliasIndexByLocale.get(locale);
  if (cached) return cached;
  const alias = new Map<string, string>();
  const indexLocales = [locale, "en"];
  for (let i = 65; i <= 90; i += 1) {
    for (let j = 65; j <= 90; j += 1) {
      const code = `${String.fromCharCode(i)}${String.fromCharCode(j)}`;
      for (const indexLocale of indexLocales) {
        const display = getRegionDisplay(indexLocale);
        if (!display) continue;
        const label = display.of(code);
        if (!label) continue;
        const normalized = normalizeCountryToken(label);
        if (!normalized || normalized === normalizeCountryToken(code)) continue;
        if (normalized.includes("unknown region") || normalized.includes("region desconocida")) continue;
        if (!alias.has(normalized)) alias.set(normalized, code);
      }
    }
  }
  for (const [token, code] of Object.entries(COUNTRY_ALIAS_OVERRIDES)) {
    alias.set(normalizeCountryToken(token), code);
  }
  cachedCountryAliasIndexByLocale.set(locale, alias);
  return alias;
}

function resolveCountryFromToken(raw: string): { key: string; label: string } {
  const normalizedToken = normalizeCountryToken(raw);
  if (!normalizedToken) return { key: "name:unknown", label: normalizeCountryLabel(raw) };
  const locale = getCurrentLanguage();
  const code = buildCountryAliasIndex(locale).get(normalizedToken);
  if (code) {
    const display = getRegionDisplay(getCurrentLocale()) ?? getRegionDisplay(locale);
    const localized = display?.of(code);
    if (localized && normalizeCountryToken(localized) !== normalizeCountryToken(code)) {
      return { key: `iso:${code}`, label: localized };
    }
  }
  return { key: `name:${normalizedToken}`, label: normalizeCountryLabel(raw) };
}

function extractCountryFromSpotAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const candidate = normalizeCountryLabel(parts[parts.length - 1] ?? "");
  if (candidate.length < 2) return null;
  if (/\d/.test(candidate)) return null;
  return candidate;
}

export function resolveCountryForSpot(spot: SpotForCountryBucket): { key: string; label: string } | null {
  const token = extractCountryFromSpotAddress(spot.address);
  if (!token) return null;
  return resolveCountryFromToken(token);
}

export function buildCountryBuckets(spots: SpotForCountryBucket[]): CountryBucket[] {
  const buckets = new Map<string, CountryBucket>();
  for (const spot of spots) {
    const resolved = resolveCountryForSpot(spot);
    if (!resolved) continue;
    const key = resolved.key;
    const previous = buckets.get(key);
    if (previous) {
      previous.count += 1;
      continue;
    }
    buckets.set(key, { key, label: resolved.label, count: 1 });
  }
  return [...buckets.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label, "es");
  });
}
