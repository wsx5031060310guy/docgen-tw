"use client";
import { Icon } from "./Icon";
import { DEFAULT_LOCALE, t, type Locale } from "@/lib/i18n/dict";

type Variant = "inline" | "card" | "footer";
type HeadingLevel = 2 | 3 | 4;

export function LawyerReferralCTA({
  variant = "inline",
  context,
  headingLevel,
  locale = DEFAULT_LOCALE,
}: {
  variant?: Variant;
  context?: string;
  headingLevel?: HeadingLevel;
  locale?: Locale;
}) {
  const href =
    context && context.trim()
      ? `/disclaimer?topic=${encodeURIComponent(context)}#referral`
      : `/disclaimer#referral`;

  if (variant === "footer") {
    return (
      <a href={href} className="dg-referral-footer-link">
        {t(locale, "lawyer.footer")}
      </a>
    );
  }

  if (variant === "card") {
    const HeadingTag = headingLevel ? (`h${headingLevel}` as "h2" | "h3" | "h4") : "p";
    return (
      <div className="card dg-referral-card">
        <div className="dg-referral-card__header">
          <Icon name="scale" size={16} />
          <HeadingTag className="dg-referral-card__title">{t(locale, "lawyer.title")}</HeadingTag>
        </div>
        <p className="dg-referral-card__copy">
          {t(locale, "lawyer.copy")}
        </p>
        <a href={href} className="btn btn-soft btn-sm dg-referral-card__action">
          <Icon name="mail" size={13} />
          {t(locale, "lawyer.action")}
        </a>
      </div>
    );
  }

  return (
    <a href={href} className="btn btn-soft btn-sm">
      <Icon name="scale" size={13} />
      {t(locale, "lawyer.action")}
    </a>
  );
}
