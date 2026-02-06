/**
 * Historial de búsquedas completadas (usuario escribió y seleccionó un resultado).
 * Máximo 5 queries; solo se guardan cuando la búsqueda fue "completada".
 */

const STORAGE_KEY = 'flowya_search_history';
const MAX_ITEMS = 5;

export function getSearchHistory(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function addSearchHistoryQuery(query: string): void {
  const q = query.trim();
  if (!q) return;
  const list = getSearchHistory();
  const without = list.filter((x) => x.toLowerCase() !== q.toLowerCase());
  const next = [q, ...without].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
