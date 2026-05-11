export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", padding: "32px 0", marginTop: 24 }}>
      <div className="container" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div className="row gap-3" style={{ color: "var(--ink-muted)", fontSize: 13 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" }}>DocGen TW</span>
            <span>© 2026</span>
            <span>·</span>
            <span>台北市信義區</span>
          </div>
          <div className="row gap-4" style={{ fontSize: 13, color: "var(--ink-muted)", flexWrap: "wrap" }}>
            <a href="/disclaimer">法律免責 / 律師轉介</a>
            <a href="/cases">案件資料夾</a>
            <a href="/contracts/new">建立合約</a>
            <a href="mailto:hello@docgen.tw">聯絡我們</a>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-muted)", lineHeight: 1.6 }}>
          DocGen TW 為文件自動化與風險提示服務，<b>不取代執業律師意見</b>。涉及訴訟、重大金額或客製條款者，請洽
          <a href="/disclaimer" style={{ textDecoration: "underline", marginLeft: 4 }}>合作律師</a>。
        </div>
      </div>
    </footer>
  );
}
