/**
 * Helpers puros para deduplicación de texto en spots.
 * Separados del cliente de datos para poder reutilizarlos y testearlos sin Supabase.
 */

/**
 * Normaliza el título para comparación:
 * lowercase, trim, quitar acentos, colapsar espacios internos.
 */
export function normalizeSpotTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return '';
  const withoutAccents = trimmed
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  const lower = withoutAccents.toLowerCase();
  return lower.replace(/\s+/g, ' ').trim();
}

/** Normaliza dirección para dedupe (misma semántica que título). */
export function normalizeAddressKey(address: string | null | undefined): string {
  if (address == null) return '';
  return normalizeSpotTitle(address);
}

/** Solo los matches exactos normalizados cuentan como duplicado duro por título. */
export function titlesExactlyDuplicate(a: string, b: string): boolean {
  const left = normalizeSpotTitle(a);
  const right = normalizeSpotTitle(b);
  if (!left || !right) return false;
  return left === right;
}
