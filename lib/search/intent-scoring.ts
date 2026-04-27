import { normalizeSearchText, tokenizeSearchText } from "./intent-normalize.ts";

export type SpotSearchDocumentInput = {
  id?: string;
  title?: string | null;
  description_short?: string | null;
  address?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  linked_maki?: string | null;
  tags?: string[] | null;
  aliases?: string[] | null;
};

export type SpotSearchDocument = {
  id?: string;
  title: string;
  titleTokens: string[];
  secondary: string;
  secondaryTokens: string[];
  aliases: string[];
  aliasTokens: string[];
};

export type SpotIntentScore = {
  score: number;
  matchedField: "title" | "alias" | "secondary" | null;
  reasons: string[];
};

const MIN_REASONABLE_SCORE = 40;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function buildSpotSearchDocument(spot: SpotSearchDocumentInput): SpotSearchDocument {
  const title = normalizeSearchText(spot.title ?? "");
  const secondary = normalizeSearchText(
    [
      spot.description_short,
      spot.address,
      spot.city,
      spot.region,
      spot.country,
      spot.linked_maki,
      ...(spot.tags ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
  const aliases = unique((spot.aliases ?? []).map((alias) => normalizeSearchText(alias)));

  return {
    id: spot.id,
    title,
    titleTokens: tokenizeSearchText(title),
    secondary,
    secondaryTokens: tokenizeSearchText(secondary),
    aliases,
    aliasTokens: unique(aliases.flatMap((alias) => tokenizeSearchText(alias))),
  };
}

function levenshteinAtMost(a: string, b: string, maxDistance: number): number {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;
  if (a === b) return 0;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, curr[j]);
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }
  return prev[b.length];
}

function tokenScore(queryToken: string, docToken: string): { score: number; reason: string } | null {
  if (!queryToken || !docToken) return null;
  if (queryToken === docToken) return { score: 90, reason: "token_exact" };

  if (queryToken.length >= 3 && docToken.startsWith(queryToken)) {
    return { score: 72, reason: "token_prefix" };
  }
  if (queryToken.length >= 4 && docToken.includes(queryToken)) {
    return { score: 64, reason: "token_contains" };
  }
  if (queryToken.length >= 5 && docToken.length >= 5) {
    const maxDistance = queryToken.length >= 6 || docToken.length >= 6 ? 2 : 1;
    const distance = levenshteinAtMost(queryToken, docToken, maxDistance);
    if (distance <= maxDistance) {
      return { score: distance === 1 ? 62 : 56, reason: `token_fuzzy_${distance}` };
    }
  }
  return null;
}

function bestTokenScore(
  queryTokens: string[],
  docTokens: string[],
  field: "title" | "alias" | "secondary",
): SpotIntentScore {
  let best: SpotIntentScore = { score: 0, matchedField: null, reasons: [] };
  for (const queryToken of queryTokens) {
    for (const docToken of docTokens) {
      const match = tokenScore(queryToken, docToken);
      if (!match) continue;
      const score = field === "secondary" ? Math.min(match.score, 44) : match.score;
      if (score > best.score) {
        best = { score, matchedField: field, reasons: [match.reason] };
      }
    }
  }
  return best;
}

function scoreDocumentForNormalizedQuery(
  document: SpotSearchDocument,
  normalizedQuery: string,
): SpotIntentScore {
  if (!normalizedQuery) return { score: 0, matchedField: null, reasons: [] };
  const queryTokens = tokenizeSearchText(normalizedQuery);
  if (queryTokens.length === 0) return { score: 0, matchedField: null, reasons: [] };

  if (document.title === normalizedQuery) {
    return { score: 100, matchedField: "title", reasons: ["title_exact"] };
  }
  if (document.aliases.includes(normalizedQuery)) {
    return { score: 88, matchedField: "alias", reasons: ["alias_exact"] };
  }
  if (normalizedQuery.length >= 4 && document.title.includes(normalizedQuery)) {
    return { score: 84, matchedField: "title", reasons: ["title_phrase_contains"] };
  }

  const titleScore = bestTokenScore(queryTokens, document.titleTokens, "title");
  const aliasScore = bestTokenScore(queryTokens, document.aliasTokens, "alias");
  const secondaryScore = bestTokenScore(queryTokens, document.secondaryTokens, "secondary");
  const best = [titleScore, aliasScore, secondaryScore].sort((a, b) => b.score - a.score)[0];
  if (best.score < MIN_REASONABLE_SCORE) return { score: 0, matchedField: null, reasons: [] };
  return best;
}

export function scoreSpotForQuery(
  document: SpotSearchDocument,
  query: string,
  queryAliases: readonly string[] = [],
): SpotIntentScore {
  const normalizedQueries = unique([
    normalizeSearchText(query),
    ...queryAliases.map((alias) => normalizeSearchText(alias)),
  ]);

  let best: SpotIntentScore = { score: 0, matchedField: null, reasons: [] };
  for (const normalizedQuery of normalizedQueries) {
    const score = scoreDocumentForNormalizedQuery(document, normalizedQuery);
    if (score.score > best.score) best = score;
  }
  return best;
}
