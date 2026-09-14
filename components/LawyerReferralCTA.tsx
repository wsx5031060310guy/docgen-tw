"use client";
import { Icon } from "./Icon";

type Variant = "inline" | "card" | "footer";
type HeadingLevel = 2 | 3 | 4;

export function LawyerReferralCTA({
  variant = "inline",
  context,
  headingLevel,
}: {
  variant?: Variant;
  context?: string;
  headingLevel?: HeadingLevel;
}) {
  const href =
    context && context.trim()
      ? `/disclaimer?topic=${encodeURIComponent(context)}#referral`
      : `/disclaimer#referral`;

  if (variant === "footer") {
    return (
      <a href={href} className="dg-referral-footer-link">
        律師轉介
      </a>
    );
  }

  if (variant === "card") {
    const HeadingTag = headingLevel ? (`h${headingLevel}` as "h2" | "h3" | "h4") : "p";
    return (
      <div className="card dg-referral-card">
        <div className="dg-referral-card__header">
          <Icon name="scale" size={16} />
          <HeadingTag className="dg-referral-card__title">需要執業律師審閱？</HeadingTag>
        </div>
        <p className="dg-referral-card__copy">
          DocGen TW 僅提供文件自動化與風險提示，不取代律師意見。
          若合約金額龐大、跨境、或涉及訴訟風險，建議由合作律師審閱。
        </p>
        <a href={href} className="btn btn-soft btn-sm dg-referral-card__action">
          <Icon name="mail" size={13} />
          申請律師轉介
        </a>
      </div>
    );
  }

  return (
    <a href={href} className="btn btn-soft btn-sm">
      <Icon name="scale" size={13} />
      申請律師轉介
    </a>
  );
}
