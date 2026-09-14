import { COMPANY } from "@/lib/company";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="dg-footer">
      <div className="dg-page-shell dg-footer-inner">
        <div className="dg-footer-row">
          <div className="dg-footer-brand">
            <span className="dg-footer-wordmark">DocGen TW</span>
            <span>© 2026</span>
          </div>
          <nav className="dg-footer-links" aria-label="頁尾導覽">
            <Link href="/terms">服務條款</Link>
            <Link href="/privacy">隱私權政策</Link>
            <Link href="/refund">退款政策</Link>
            <Link href="/disclaimer">法律免責 / 律師轉介</Link>
            <Link href="/cases">案件資料夾</Link>
            <Link href="/contracts/new">建立合約</Link>
            <a href={`mailto:${COMPANY.email}`}>聯絡我們</a>
          </nav>
        </div>
        <div className="dg-footer-meta">
          {COMPANY.name}｜統一編號 {COMPANY.taxId}｜{COMPANY.address}｜
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        </div>
        <div className="dg-footer-disclaimer">
          DocGen TW 為文件自動化與風險提示服務，<b>不取代執業律師意見</b>。涉及訴訟、重大金額或客製條款者，請洽
          <Link href="/disclaimer" className="dg-footer-inline-link">合作律師</Link>。
        </div>
      </div>
    </footer>
  );
}
