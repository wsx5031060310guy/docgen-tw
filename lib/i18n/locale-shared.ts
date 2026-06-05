// Constants safe to import from both client and server components.
// Keep this file dependency-free (no next/headers etc).

import { DEFAULT_LOCALE, LOCALES, type Locale } from "./dict";

export const LOCALE_COOKIE = "docgen_locale";

// Routes that have a real localized (non-default-locale) page under app/<locale>/.
// Functional pages (contracts, cases, checkout, settings) are zh-Hant-only by
// design — the contract body is Traditional Chinese (governing law) and there is
// no English variant of those screens — so they must never get an /en prefix,
// otherwise the link 404s. Marketing/explainer routes below DO have /en pages.
// Match is by base path (the segment after the optional locale prefix).
const LOCALIZED_BASE_PATHS = ["/", "/check", "/disclaimer", "/templates"] as const;

function basePath(path: string): string {
  return path.replace(/^\/(en|zh-Hant)(?=\/|$)/, "") || "/";
}

// True when `path` points at a route that actually has a page for `locale`.
// The default locale serves every route; non-default locales only serve the
// whitelisted marketing/explainer routes.
export function hasLocalizedRoute(locale: Locale, path: string): boolean {
  if (locale === DEFAULT_LOCALE) return true;
  const clean = basePath(path);
  return LOCALIZED_BASE_PATHS.some((b) => b === "/" ? clean === "/" : clean === b || clean.startsWith(b + "/"));
}

export function pathForLocale(locale: Locale, path: string): string {
  const stripped = path.replace(/^\/(en|zh-Hant)(?=\/|$)/, "");
  const clean = stripped.startsWith("/") ? stripped : "/" + stripped;
  // Fall back to the default-locale (unprefixed) path when the target locale
  // has no page for this route, so language switches never land on a 404.
  if (locale === DEFAULT_LOCALE || !hasLocalizedRoute(locale, clean)) {
    return clean === "" ? "/" : clean;
  }
  return `/${locale}${clean === "/" ? "" : clean}`;
}

export { LOCALES };
