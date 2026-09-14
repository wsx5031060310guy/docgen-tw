"use client";
import { usePathname, useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n/dict";
import { pathForLocale, LOCALE_COOKIE } from "@/lib/i18n/locale-shared";

const LABELS: Record<Locale, string> = { "zh-Hant": "繁中", en: "EN" };

export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname() || "/";
  const router = useRouter();

  function switchTo(loc: Locale) {
    if (loc === current) return;
    // Persist preference, then navigate.
    // eslint-disable-next-line react-hooks/immutability -- document.cookie is the supported compatibility path here.
    document.cookie = `${LOCALE_COOKIE}=${loc}; path=/; max-age=${60 * 60 * 24 * 365 * 2}; SameSite=Lax`;
    router.push(pathForLocale(loc, pathname));
  }

  return (
    <div className="dg-locale-switch" role="group" aria-label={current === "en" ? "Language" : "語言"}>
      {LOCALES.map((l, i) => (
        <span key={l} className="dg-locale-option">
          {i > 0 && <span className="dg-locale-divider" aria-hidden="true">·</span>}
          <button
            type="button"
            className="dg-locale-button"
            onClick={() => switchTo(l)}
            aria-pressed={l === current}
            aria-label={l === "zh-Hant" ? "繁體中文" : "English"}
          >
            {LABELS[l]}
          </button>
        </span>
      ))}
    </div>
  );
}
