"use client";
import { Icon } from "./Icon";

export function TrustBar({
  items,
}: {
  items: { icon: string; value: string; label: string }[];
}) {
  return (
    <div
      className="row"
      style={{
        gap: 40, flexWrap: "wrap", justifyContent: "center", padding: "20px 24px",
        borderRadius: "var(--radius-lg)", background: "var(--bg-elev)", border: "1px solid var(--line)",
      }}
    >
      {items.map((it, i) => (
        <div key={i} className="row gap-3">
          <Icon name={it.icon} size={18} style={{ color: "var(--primary)" }} />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
              {it.value}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{it.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
