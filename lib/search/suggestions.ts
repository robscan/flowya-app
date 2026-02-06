/**
 * S3: Sugerencias estilo Google. Solo cuando stage global + 0 resultados.
 * Diccionario mínimo ES↔EN curado; normalización vía normalizeQuery.
 * Máximo 3 sugerencias.
 */

import { normalizeQuery } from '@/lib/search/normalize';

/** [clave normalizada (sin acentos, lower), texto de sugerencia para el input] */
const DICT: [string, string][] = [
  ['capitolio', 'Capitol'],
  ['mirador', 'Viewpoint'],
  ['playa', 'Beach'],
  ['museo', 'Museum'],
  ['catedral', 'Cathedral'],
  ['parque', 'Park'],
  ['castillo', 'Castle'],
  ['plaza', 'Square'],
  ['mercado', 'Market'],
  ['puente', 'Bridge'],
  ['capitol', 'Capitolio'],
  ['viewpoint', 'Mirador'],
  ['beach', 'Playa'],
  ['museum', 'Museo'],
  ['cathedral', 'Catedral'],
  ['park', 'Parque'],
  ['castle', 'Castillo'],
  ['square', 'Plaza'],
  ['market', 'Mercado'],
  ['bridge', 'Puente'],
  ['teatro', 'Theater'],
  ['theater', 'Teatro'],
  ['iglesia', 'Church'],
  ['church', 'Iglesia'],
  ['torre', 'Tower'],
  ['tower', 'Torre'],
  ['monumento', 'Monument'],
  ['monument', 'Monumento'],
  ['lago', 'Lake'],
  ['lake', 'Lago'],
  ['rio', 'River'],
  ['river', 'Río'],
  ['centro', 'Center'],
  ['center', 'Centro'],
];

const MAX_SUGGESTIONS = 3;

/**
 * Devuelve hasta 3 sugerencias para la query (solo cuando stage global + 0 resultados).
 * Usa normalización y diccionario ES↔EN; formato listo para el input.
 */
export function getSuggestions(query: string): string[] {
  const q = (query ?? '').trim();
  if (q.length < 3) return [];

  const words = q.split(/\s+/);
  const normalizedWords = words.map((w) => normalizeQuery(w));
  const seen = new Set<string>();
  const out: string[] = [];

  for (const [key, displayValue] of DICT) {
    if (out.length >= MAX_SUGGESTIONS) break;
    const idx = normalizedWords.findIndex((nw) => nw === key);
    if (idx === -1) continue;
    const replaced = [...words];
    replaced[idx] = displayValue;
    const suggestion = replaced.join(' ');
    if (seen.has(suggestion.toLowerCase())) continue;
    seen.add(suggestion.toLowerCase());
    out.push(suggestion);
  }

  return out.slice(0, MAX_SUGGESTIONS);
}
