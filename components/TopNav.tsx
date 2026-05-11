"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { t, type Locale, DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/dict";
import { LOCALE_COOKIE } from "@/lib/i18n/locale-shared";

function detectLocale(pathname: string): Locale {
  if (pathname.startsWith("/en/") || pathname === "/en") return "en";
  // Read cookie if available
  if (typeof document !== "undefined") {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`));
    const c = m?.[1] as Locale | undefined;
    if (c && LOCALES.includes(c)) return c;
  }
  return DEFAULT_LOCALE;
}

function prefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}

export function TopNav() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => { setLocale(detectLocale(pathname)); }, [pathname]);

  const p = prefix(locale);
  const links: { href: string; label: string; match: (path: string) => boolean }[] = [
    { href: `${p || "/"}`, label: t(locale, "nav.templates"), match: (x) => x === (p || "/") },
    { href: `${p}/check`, label: t(locale, "nav.check"), match: (x) => x.startsWith(`${p}/check`) },
    { href: `${p}/contracts/new`, label: t(locale, "nav.new_contract"), match: (x) => x === `${p}/contracts/new` },
    { href: `${p}/contracts`, label: t(locale, "nav.my_contracts"), match: (x) => x === `${p}/contracts` || (x.startsWith(`${p}/contracts/`) && x !== `${p}/contracts/new`) },
    { href: `${p}/cases`, label: t(locale, "nav.cases"), match: (x) => x.startsWith(`${p}/cases`) },
    { href: `${p}/checkout`, label: t(locale, "nav.pricing"), match: (x) => x === `${p}/checkout` },
    { href: `${p}/settings`, label: t(locale, "nav.settings"), match: (x) => x.startsWith(`${p}/settings`) },
  ];

  return (
    <nav className="nav">
      <div className="row gap-6">
        <Link href={p || "/"} className="nav-logo">
          <span className="nav-logo-mark">契</span>
          <span>
            DocGen<span style={{ color: "var(--ink-muted)", fontWeight: 400, marginLeft: 6 }}>TW</span>
          </span>
        </Link>
        <div className="nav-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`nav-link ${l.match(pathname) ? "active" : ""}`}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="row gap-3">
        <LocaleSwitcher current={locale} />
        <div className="row gap-2" style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
          <Icon name="lock" size={13} />
          <span>SSL · {t(locale, "home.trust.signlaw")}</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => router.push(`${p}/contracts/new`)}>
          {t(locale, "nav.start")}
        </button>
      </div>
    </nav>
  );
}
