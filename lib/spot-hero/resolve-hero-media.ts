export type ResolveHeroMediaArgs = {
  /** URLs personales (galería). */
  personalUris?: string[] | null;
  /** URL de portada (puede ser “comunitaria”). */
  coverUrl?: string | null;
  /** Si true, no usar coverUrl como fallback. */
  hideCoverFallback?: boolean;
};

export function resolveHeroUris({
  personalUris,
  coverUrl,
  hideCoverFallback = false,
}: ResolveHeroMediaArgs): string[] {
  const p = (personalUris ?? []).filter((u) => typeof u === "string" && u.trim().length > 0);
  if (p.length > 0) return p;
  if (hideCoverFallback) return [];
  const c = (coverUrl ?? "").trim();
  return c ? [c] : [];
}

