/**
 * Perfil en desktop Explore (≥1080): estado en query `?account=` de la ruta del mapa,
 * no en el stack raíz `/account/*` (evita capa full-screen que bloquea el mapa).
 */

export const ACCOUNT_DESKTOP_QUERY_KEY = "account" as const;

export type AccountDesktopPanelKey = "profile" | "details" | "privacy" | "tags" | "language";

export function parseAccountDesktopPanel(
  raw: string | string[] | undefined,
): AccountDesktopPanelKey | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v == null || String(v).trim() === "") return null;
  if (v === "profile" || v === "details" || v === "privacy" || v === "tags" || v === "language") return v;
  return null;
}
