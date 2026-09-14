"use client";
import Link from "next/link";
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
  href,
  disabled = false,
  busy = false,
  featuredLabel = "最受歡迎",
}: {
  plan: Plan;
  featured?: boolean;
  onSelect?: () => void;
  href?: string;
  disabled?: boolean;
  busy?: boolean;
  featuredLabel?: string;
}) {
  const unavailable = disabled || busy;
  const buttonClass = featured ? "btn btn-stamp btn-lg" : "btn btn-primary btn-lg";
  const ctaContent = (
    <>
      {busy ? `${plan.cta}…` : plan.cta}
      <Icon name={busy ? "loader" : "arrowRight"} size={15} className={busy ? "spin" : ""} />
    </>
  );

  return (
    <div
      className={`card dg-plan-card ${featured ? "dg-card-featured" : ""}`.trim()}
      data-featured={featured || undefined}
      aria-busy={busy || undefined}
    >
      {featured && featuredLabel && (
        <div className="dg-plan-badge">{featuredLabel}</div>
      )}
      <div>
        <div className="dg-eyebrow">{plan.tag}</div>
        <h3 className="dg-section-title dg-plan-title">{plan.name}</h3>
        <p className="dg-text-secondary dg-plan-tagline">{plan.tagline}</p>
      </div>
      <div className="dg-plan-price-row">
        <span className="dg-plan-currency">NT$</span>
        <span className="dg-price dg-plan-price">{plan.price}</span>
        <span className="dg-plan-unit">/ {plan.unit}</span>
      </div>
      <div className="divider" />
      <ul className="dg-plan-features">
        {plan.features.map((f, i) => (
          <li key={i}>
            <Icon name="check" size={16} style={{ color: "var(--primary)", marginTop: 2 }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {href && !unavailable ? (
        <Link className={`${buttonClass} dg-plan-cta`} href={href}>{ctaContent}</Link>
      ) : (
        <button
          type="button"
          className={`${buttonClass} dg-plan-cta`}
          onClick={onSelect}
          disabled={unavailable}
          aria-busy={busy || undefined}
        >
          {ctaContent}
        </button>
      )}
    </div>
  );
}
