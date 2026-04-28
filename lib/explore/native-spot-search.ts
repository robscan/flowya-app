import { normalizeSearchText, tokenizeSearchText } from "../search/intent-normalize.ts";

export type NativeSearchSpot = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
};

export type NativeSpotSearchResult = NativeSearchSpot & {
  score: number;
};

export function filterNativeSpotResults(
  spots: NativeSearchSpot[],
  query: string,
  limit = 8,
): NativeSpotSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeSearchText(normalizedQuery);
  if (!normalizedQuery || tokens.length === 0) return [];

  return spots
    .map((spot) => ({
      ...spot,
      score: scoreNativeSpot(spot, normalizedQuery, tokens),
    }))
    .filter((spot) => spot.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.title.localeCompare(b.title, "es");
    })
    .slice(0, limit);
}

function scoreNativeSpot(spot: NativeSearchSpot, normalizedQuery: string, tokens: string[]): number {
  const title = normalizeSearchText(spot.title);
  if (!title) return 0;
  if (title === normalizedQuery) return 100;
  if (title.startsWith(normalizedQuery)) return 82;
  if (title.includes(normalizedQuery)) return 68;
  if (tokens.every((token) => title.includes(token))) return 56;
  if (tokens.some((token) => token.length >= 4 && title.includes(token))) return 34;
  return 0;
}
