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
  const [open, setOpen] = useState(false);
  useEffect(() => { setLocale(detectLocale(pathname)); }, [pathname]);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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
      <div className="row gap-3 nav-right">
        <LocaleSwitcher current={locale} />
        <div className="row gap-2 nav-trust" style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
          <Icon name="lock" size={13} />
          <span>SSL · {t(locale, "home.trust.signlaw")}</span>
        </div>
        <button className="btn btn-primary btn-sm nav-cta" onClick={() => router.push(`${p}/contracts/new`)}>
          {t(locale, "nav.start")}
        </button>
        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? "x" : "list"} size={22} />
        </button>
      </div>

      {open && (
        <>
          <div className="nav-drawer-backdrop" onClick={() => setOpen(false)} />
          <div className="nav-drawer" role="dialog" aria-label="Main menu">
            <div className="nav-drawer-list">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`nav-drawer-link ${l.match(pathname) ? "active" : ""}`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => { setOpen(false); router.push(`${p}/contracts/new`); }}
            >
              {t(locale, "nav.start")}
            </button>
            <div className="row gap-2" style={{ marginTop: 14, fontSize: 12.5, color: "var(--ink-muted)" }}>
              <Icon name="lock" size={13} />
              <span>SSL · {t(locale, "home.trust.signlaw")}</span>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
