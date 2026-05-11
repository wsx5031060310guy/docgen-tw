// Server-only helpers for picking the active locale.
// Priority: explicit pathname prefix (/en/...) > cookie > default.

import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./dict";
import { LOCALE_COOKIE } from "./locale-shared";

export { LOCALE_COOKIE };

function parseFromPath(path: string | null): Locale | null {
  if (!path) return null;
  for (const l of LOCALES) {
    if (l === DEFAULT_LOCALE) continue; // default has no prefix
    if (path === `/${l}` || path.startsWith(`/${l}/`)) return l;
  }
  return null;
}

export async function getServerLocale(): Promise<Locale> {
  const h = await headers();
  const pathLoc = parseFromPath(h.get("x-pathname"));
  if (pathLoc) return pathLoc;
  const c = await cookies();
  const ck = c.get(LOCALE_COOKIE)?.value as Locale | undefined;
  if (ck && LOCALES.includes(ck)) return ck;
  return DEFAULT_LOCALE;
}

export { pathForLocale } from "./locale-shared";
