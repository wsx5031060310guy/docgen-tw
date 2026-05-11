"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./Icon";

const LINKS: { href: string; label: string; match: (p: string) => boolean }[] = [
  { href: "/", label: "模板", match: (p) => p === "/" },
  { href: "/check", label: "風險快檢", match: (p) => p.startsWith("/check") },
  { href: "/contracts/new", label: "建立合約", match: (p) => p === "/contracts/new" },
  { href: "/contracts", label: "我的合約", match: (p) => p === "/contracts" || (p.startsWith("/contracts/") && p !== "/contracts/new") },
  { href: "/cases", label: "案件", match: (p) => p.startsWith("/cases") },
  { href: "/checkout", label: "方案", match: (p) => p === "/checkout" },
];

export function TopNav() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  return (
    <nav className="nav">
      <div className="row gap-6">
        <Link href="/" className="nav-logo">
          <span className="nav-logo-mark">契</span>
          <span>
            DocGen<span style={{ color: "var(--ink-muted)", fontWeight: 400, marginLeft: 6 }}>TW</span>
          </span>
        </Link>
        <div className="nav-links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`nav-link ${l.match(pathname) ? "active" : ""}`}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="row gap-3">
        <div className="row gap-2" style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
          <Icon name="lock" size={13} />
          <span>SSL · 電子簽章法 §4 合規</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => router.push("/contracts/new")}>
          開始建立
        </button>
      </div>
    </nav>
  );
}
