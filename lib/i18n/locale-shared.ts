// Constants safe to import from both client and server components.
// Keep this file dependency-free (no next/headers etc).

import { DEFAULT_LOCALE, LOCALES, type Locale } from "./dict";

export const LOCALE_COOKIE = "docgen_locale";

export function pathForLocale(locale: Locale, path: string): string {
  const stripped = path.replace(/^\/(en|zh-Hant)(?=\/|$)/, "");
  const clean = stripped.startsWith("/") ? stripped : "/" + stripped;
  if (locale === DEFAULT_LOCALE) return clean === "" ? "/" : clean;
  return `/${locale}${clean === "/" ? "" : clean}`;
}

export { LOCALES };
