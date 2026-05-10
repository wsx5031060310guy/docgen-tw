export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", padding: "32px 0", marginTop: 24 }}>
      <div className="container row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div className="row gap-3" style={{ color: "var(--ink-muted)", fontSize: 13 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" }}>DocGen TW</span>
          <span>© 2026</span>
          <span>·</span>
          <span>台北市信義區</span>
        </div>
        <div className="row gap-4" style={{ fontSize: 13, color: "var(--ink-muted)" }}>
          <a>隱私政策</a><a>服務條款</a><a>法律免責</a><a>聯絡我們</a>
        </div>
      </div>
    </footer>
  );
}
