"use client";
import { Icon } from "./Icon";

export type Plan = {
  tag: string;
  name: string;
  tagline: string;
  price: string;
  unit: string;
  cta: string;
  features: string[];
  code: string;
};

export function PlanCard({
  plan,
  featured,
  onSelect,
}: {
  plan: Plan;
  featured?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div
      className="card"
      style={{
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        borderColor: featured ? "var(--primary)" : "var(--line)",
        borderWidth: featured ? 2 : 1,
        position: "relative",
        transform: featured ? "translateY(-6px)" : undefined,
        boxShadow: featured ? "var(--shadow-lg)" : "var(--shadow-sm)",
      }}
    >
      {featured && (
        <div
          style={{
            position: "absolute", top: -12, left: 24, padding: "4px 12px",
            background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 600,
            borderRadius: 999, letterSpacing: "0.06em",
          }}
        >
          最受歡迎
        </div>
      )}
      <div>
        <div style={{ fontSize: 13, color: "var(--ink-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {plan.tag}
        </div>
        <h3 style={{ fontSize: 22, marginTop: 4 }}>{plan.name}</h3>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginTop: 6 }}>{plan.tagline}</p>
      </div>
      <div className="row" style={{ alignItems: "baseline", gap: 4 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--ink-muted)" }}>NT$</span>
        <span
          style={{
            fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 600,
            lineHeight: 1, fontVariantNumeric: "tabular-nums",
          }}
        >
          {plan.price}
        </span>
        <span style={{ color: "var(--ink-muted)", fontSize: 14 }}>/ {plan.unit}</span>
      </div>
      <div className="divider" />
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
        {plan.features.map((f, i) => (
          <li key={i} className="row gap-2" style={{ alignItems: "flex-start" }}>
            <Icon name="check" size={16} style={{ color: "var(--primary)", marginTop: 2 }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        className={featured ? "btn btn-stamp btn-lg" : "btn btn-primary btn-lg"}
        style={{ marginTop: "auto" }}
        onClick={onSelect}
      >
        {plan.cta} <Icon name="arrowRight" size={15} />
      </button>
    </div>
  );
}
