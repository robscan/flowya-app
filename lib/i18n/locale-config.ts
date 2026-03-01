/**
 * Locale config canónico (fase pre-i18n completa).
 *
 * Política actual:
 * - DEV: idioma manual fijo en español.
 * - FUTURO: conmutar a idioma del sistema sin tocar call sites.
 */

export type LocaleMode = "manual" | "system";

/** Cambiar a "system" cuando se active traducción por idioma del dispositivo. */
export const APP_LOCALE_MODE: LocaleMode = "manual";
/** Override manual de desarrollo/QA. */
export const APP_MANUAL_LOCALE = "es-MX";

function resolveSystemLocale(): string {
  if (typeof navigator !== "undefined" && typeof navigator.language === "string") {
    const nav = navigator.language.trim();
    if (nav) return nav;
  }
  try {
    const intl = Intl.DateTimeFormat().resolvedOptions().locale?.trim();
    if (intl) return intl;
  } catch {
    // fallback below
  }
  return "es-MX";
}

/** Locale efectivo de la app (único punto de lectura). */
export function getCurrentLocale(): string {
  if (APP_LOCALE_MODE === "manual") return APP_MANUAL_LOCALE;
  return resolveSystemLocale();
}

/** Lengua base (`es`, `en`, etc.) útil para etiquetas regionales. */
export function getCurrentLanguage(): string {
  const locale = getCurrentLocale().toLowerCase();
  const [base] = locale.split("-");
  return base || "es";
}

