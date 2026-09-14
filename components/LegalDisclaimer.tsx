"use client";
import { Icon } from "./Icon";
import { DEFAULT_LOCALE, t, type Locale } from "@/lib/i18n/dict";

type HeadingLevel = 2 | 3 | 4;

export function LegalDisclaimer({
  compact,
  headingLevel,
  locale = DEFAULT_LOCALE,
}: {
  compact?: boolean;
  headingLevel?: HeadingLevel;
  locale?: Locale;
}) {
  if (compact)
    return (
      <div className="dg-legal-disclaimer dg-legal-disclaimer--compact">
        <Icon name="alert" size={12} />
        <span>{t(locale, "legal.compact")}</span>
      </div>
    );
  const HeadingTag = headingLevel ? (`h${headingLevel}` as "h2" | "h3" | "h4") : null;
  return (
    <div className="dg-notice dg-notice--warning dg-legal-disclaimer">
      <Icon name="fileWarn" size={18} />
      <div className="dg-legal-disclaimer__content">
        {HeadingTag ? (
          <HeadingTag className="dg-legal-disclaimer__title">{t(locale, "legal.title")}</HeadingTag>
        ) : (
          <strong className="dg-legal-disclaimer__title dg-legal-disclaimer__title--inline">{t(locale, "legal.title")}</strong>
        )}
        <p className={HeadingTag ? "dg-legal-disclaimer__copy" : "dg-legal-disclaimer__copy dg-legal-disclaimer__copy--inline"}>
          {!HeadingTag && "　"}{t(locale, "legal.body_prefix")}
          <b>{t(locale, "legal.service")}</b>{t(locale, "legal.body_middle")}
          <a href="/disclaimer#referral" className="dg-legal-disclaimer__link">
            {t(locale, "legal.lawyer_link")}
          </a>
          {t(locale, "legal.body_end")}
        </p>
      </div>
    </div>
  );
}
