"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Icon } from "./Icon";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { t, type Locale, DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/dict";
import { LOCALE_COOKIE, pathForLocale } from "@/lib/i18n/locale-shared";

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
  const [locale, setLocale] = useState<Locale>(() => detectLocale(pathname));
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLocale(detectLocale(pathname));
      setOpen(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => {
      drawerRef.current?.querySelector<HTMLElement>("a[href], button:not(:disabled)")?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      previouslyFocused?.focus();
    };
  }, [open]);

  const p = prefix(locale);
  // Resolve every nav target through pathForLocale so routes without a page in
  // the current locale (the zh-Hant-only functional pages) fall back to the
  // unprefixed path instead of an /en/* URL that 404s.
  const href = (base: string) => pathForLocale(locale, base);
  const startHref = href("/contracts/new");
  const links: { href: string; label: string; match: (path: string) => boolean }[] = [
    { href: href("/"), label: t(locale, "nav.templates"), match: (x) => x === (p || "/") },
    { href: href("/check"), label: t(locale, "nav.check"), match: (x) => x.startsWith(`${p}/check`) },
    { href: startHref, label: t(locale, "nav.new_contract"), match: (x) => x === "/contracts/new" },
    { href: href("/contracts"), label: t(locale, "nav.my_contracts"), match: (x) => x === "/contracts" || (x.startsWith("/contracts/") && x !== "/contracts/new") },
    { href: href("/cases"), label: t(locale, "nav.cases"), match: (x) => x.startsWith("/cases") },
    { href: href("/checkout"), label: t(locale, "nav.pricing"), match: (x) => x === "/checkout" },
    { href: href("/settings"), label: t(locale, "nav.settings"), match: (x) => x.startsWith("/settings") },
  ];

  const labels = locale === "en"
    ? { skip: "Skip to main content", nav: "Main navigation", open: "Open menu", close: "Close menu", drawer: "Main menu" }
    : { skip: "跳至主要內容", nav: "主要導覽", open: "開啟選單", close: "關閉選單", drawer: "主要選單" };

  function skipToMain(event: MouseEvent<HTMLAnchorElement>) {
    const main = document.querySelector<HTMLElement>("main") ?? document.getElementById("main-content");
    if (!main) return;
    event.preventDefault();
    const hadTabIndex = main.hasAttribute("tabindex");
    if (!hadTabIndex) main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: "start" });
    if (!hadTabIndex) {
      main.addEventListener("blur", () => main.removeAttribute("tabindex"), { once: true });
    }
  }

  function handleDrawerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      drawerRef.current?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled), [tabindex]:not([tabindex='-1'])") ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
    <nav className="nav dg-topnav" aria-label={labels.nav}>
      <a className="dg-skip-link" href="#main-content" onClick={skipToMain}>{labels.skip}</a>
      <div className="row gap-6 dg-topnav-main">
        <Link href={p || "/"} className="nav-logo" aria-label="DocGen TW">
          <span className="nav-logo-mark">契</span>
          <span>
            DocGen<span className="nav-logo-suffix">TW</span>
          </span>
        </Link>
        <div className="nav-links">
          {links.map((l) => {
            const current = l.match(pathname);
            return (
              <Link key={l.href} href={l.href} className={`nav-link ${current ? "active" : ""}`} aria-current={current ? "page" : undefined}>
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="row gap-3 nav-right">
        <LocaleSwitcher current={locale} />
        <Link className="btn btn-primary btn-sm nav-cta" href={startHref}>
          {t(locale, "nav.start")}
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className="nav-toggle"
          aria-label={open ? labels.close : labels.open}
          aria-expanded={open}
          aria-controls="dg-main-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? "x" : "list"} size={22} />
        </button>
      </div>

      {open && (
        <>
          <div className="nav-drawer-backdrop" aria-hidden="true" onMouseDown={() => setOpen(false)} />
          <div
            ref={drawerRef}
            id="dg-main-menu"
            className="nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dg-main-menu-title"
            onKeyDown={handleDrawerKeyDown}
          >
            <div className="nav-drawer-header">
              <h2 id="dg-main-menu-title" className="dg-visually-hidden">{labels.drawer}</h2>
              <button type="button" className="btn btn-ghost btn-icon" aria-label={labels.close} onClick={() => setOpen(false)}>
                <Icon name="x" size={20} />
              </button>
            </div>
            <div className="nav-drawer-list">
              {links.map((l) => {
                const current = l.match(pathname);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`nav-drawer-link ${current ? "active" : ""}`}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
            <Link className="btn btn-primary btn-lg nav-drawer-cta" href={startHref} onClick={() => setOpen(false)}>
              {t(locale, "nav.start")}
            </Link>
          </div>
        </>
      )}
    </nav>
    {/* Skip-link target: the page's <main> when present, else this marker right after the nav. */}
    <span id="main-content" tabIndex={-1} />
    </>
  );
}
