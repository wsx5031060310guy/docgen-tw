import Link from "next/link";
import { Icon } from "./Icon";

export function SignTopBar() {
  return (
    <nav className="nav dg-sign-topbar" aria-label="電子簽署頁首">
      <div className="dg-sign-topbar-brand">
        <Link href="/" className="nav-logo" aria-label="DocGen TW 首頁">
          <span className="nav-logo-mark">契</span>
          <span>
            DocGen<span className="dg-sign-logo-suffix">TW</span>
          </span>
        </Link>
        <span className="dg-sign-topbar-label">電子簽署</span>
      </div>
      <span className="chip dg-sign-trust-chip">
        <Icon name="shield" size={12} />
        SSL · 電子簽章法 §4
      </span>
    </nav>
  );
}
