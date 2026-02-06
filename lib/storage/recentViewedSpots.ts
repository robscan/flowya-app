/**
 * Últimos spots abiertos desde search (máx 10). Para sección "Vistos recientemente".
 */

const STORAGE_KEY = 'flowya_recent_viewed_spot_ids';
const MAX_ITEMS = 10;

export function getRecentViewedSpotIds(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function addRecentViewedSpotId(spotId: string): void {
  if (!spotId) return;
  const list = getRecentViewedSpotIds();
  const without = list.filter((id) => id !== spotId);
  const next = [spotId, ...without].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
