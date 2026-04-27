/**
 * Canon V1 de normalización para recuperación de intención en búsqueda.
 * No usar para dedupe duro: dedupe conserva sus helpers exactos.
 */

export function normalizeSearchText(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  return raw
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeSearchText(value: string | null | undefined): string[] {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}

export function normalizeSearchToken(value: string | null | undefined): string {
  return normalizeSearchText(value).replace(/\s+/g, "");
}
