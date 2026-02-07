/**
 * S3: Sugerencias estilo Google. Solo cuando stage global + 0 resultados.
 * Tokenización + diccionario ES↔EN por palabra; recomposición con Title Case.
 * Máximo 3 sugerencias, sin duplicados ni misma query (normalizada).
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

const dictMap = new Map<string, string>(DICT);

function toTitleCase(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Devuelve hasta 3 sugerencias para la query (solo cuando stage global + 0 resultados).
 * Tokenización: por palabras, reemplazo ES↔EN por token, recomposición en Title Case.
 * No sugiere si el resultado (normalizado) es igual a la query (normalizada).
 */
export function getSuggestions(query: string): string[] {
  const q = (query ?? '').trim();
  if (q.length < 3) return [];

  const tokens = q.split(/\s+/).filter(Boolean);
  const normalizedTokens = tokens.map((t) => normalizeQuery(t));
  const normalizedQuery = normalizeQuery(q);
  const seen = new Set<string>([normalizedQuery]);
  const out: string[] = [];

  /** Una sugerencia: reemplazar todos los tokens que tengan mapping; el resto Title Case. */
  function buildFullSuggestion(): string {
    return tokens
      .map((t, i) => dictMap.get(normalizedTokens[i]) ?? toTitleCase(t))
      .join(' ');
  }

  /** Añade una sugerencia si no es duplicado ni igual a la query. */
  function add(suggestion: string): void {
    const key = normalizeQuery(suggestion);
    if (seen.has(key) || out.length >= MAX_SUGGESTIONS) return;
    seen.add(key);
    out.push(suggestion);
  }

  // 1) Sugerencia con todos los tokens reemplazados (o Title Case si no hay mapping)
  const full = buildFullSuggestion();
  add(full);

  // 2) Variantes: reemplazar solo un token por vez (el que tenga mapping)
  if (out.length < MAX_SUGGESTIONS) {
    for (let i = 0; i < tokens.length; i++) {
      const display = dictMap.get(normalizedTokens[i]);
      if (!display) continue;
      const variant = tokens
        .map((t, j) => (j === i ? display : toTitleCase(t)))
        .join(' ');
      add(variant);
      if (out.length >= MAX_SUGGESTIONS) break;
    }
  }

  return out.slice(0, MAX_SUGGESTIONS);
}
