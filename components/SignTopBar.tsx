import Link from "next/link";
import { Icon } from "./Icon";

export function SignTopBar({ progress = 0 }: { progress?: number }) {
  const normalizedProgress = Math.min(1, Math.max(0, progress));

  return (
    <>
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
      <div
        className="dg-sign-reading-progress"
        role="progressbar"
        aria-label="合約閱讀進度"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(normalizedProgress * 100)}
      >
        <span style={{ width: `${normalizedProgress * 100}%` }} />
      </div>
    </>
  );
}
