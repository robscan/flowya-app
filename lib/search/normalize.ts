/**
 * Normalización de texto para búsqueda y cache key.
 * S1: acentos, casing. S3: reutilizado por sugerencias ES↔EN.
 */

/**
 * Normaliza una cadena para comparación y cache: lowercase, sin acentos.
 */
export function normalizeQuery(text: string): string {
  const t = (text ?? '').trim();
  if (!t) return '';
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}
