"use client";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { LOCALES, type Locale } from "@/lib/i18n/dict";
import { pathForLocale, LOCALE_COOKIE } from "@/lib/i18n/locale-shared";

const LABELS: Record<Locale, string> = { "zh-Hant": "繁中", en: "EN" };

export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname() || "/";
  const router = useRouter();

  function switchTo(loc: Locale) {
    if (loc === current) return;
    // Persist preference, then navigate.
    document.cookie = `${LOCALE_COOKIE}=${loc}; path=/; max-age=${60 * 60 * 24 * 365 * 2}; SameSite=Lax`;
    router.push(pathForLocale(loc, pathname));
  }

  return (
    <div className="row gap-1" style={{ alignItems: "center", fontSize: 12 }}>
      <Icon name="info" size={11} style={{ color: "var(--ink-muted)" }} />
      {LOCALES.map((l, i) => (
        <span key={l} style={{ display: "inline-flex", alignItems: "center" }}>
          {i > 0 && <span style={{ color: "var(--ink-muted)", margin: "0 4px" }}>·</span>}
          <button
            type="button"
            onClick={() => switchTo(l)}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              color: l === current ? "var(--primary)" : "var(--ink-muted)",
              fontWeight: l === current ? 600 : 400,
              fontFamily: "inherit", fontSize: 12,
            }}
          >
            {LABELS[l]}
          </button>
        </span>
      ))}
    </div>
  );
}
