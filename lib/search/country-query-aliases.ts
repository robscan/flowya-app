import { normalizeQuery } from "./normalize";

const COUNTRY_ALIAS_LOCALES = ["es", "en"] as const;

let aliasIndex: Map<string, string> | null = null;
let namesByCode: Map<string, string[]> | null = null;

function getDisplay(locale: string): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    return null;
  }
}

function buildCountryAliasData(): {
  index: Map<string, string>;
  names: Map<string, string[]>;
} {
  if (aliasIndex && namesByCode) {
    return { index: aliasIndex, names: namesByCode };
  }

  const index = new Map<string, string>();
  const names = new Map<string, string[]>();

  for (let i = 65; i <= 90; i += 1) {
    for (let j = 65; j <= 90; j += 1) {
      const code = `${String.fromCharCode(i)}${String.fromCharCode(j)}`;
      const labels = new Set<string>();

      for (const locale of COUNTRY_ALIAS_LOCALES) {
        const display = getDisplay(locale);
        if (!display) continue;
        const label = display.of(code);
        if (!label) continue;
        const normalized = normalizeQuery(label);
        if (!normalized) continue;
        if (normalized === normalizeQuery(code)) continue;
        if (normalized.includes("unknown region") || normalized.includes("region desconocida")) continue;
        index.set(normalized, code);
        labels.add(normalized);
      }

      if (labels.size > 0) names.set(code, [...labels]);
    }
  }

  aliasIndex = index;
  namesByCode = names;
  return { index, names };
}

/**
 * Si la query corresponde a un país conocido (en es/en), expande alias de idioma.
 * Ejemplo: "alemania" -> ["alemania", "germany"].
 */
export function expandCountryQueryAliases(query: string): string[] {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];
  const { index, names } = buildCountryAliasData();
  const code = index.get(normalized);
  if (!code) return [normalized];
  const related = names.get(code);
  if (!related || related.length === 0) return [normalized];
  if (related.includes(normalized)) return related;
  return [normalized, ...related];
}

