import { COMPANY } from "@/lib/company";
import { DEFAULT_LOCALE, t, type Locale } from "@/lib/i18n/dict";
import { pathForLocale } from "@/lib/i18n/locale-shared";
import Link from "next/link";

export function Footer({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const href = (path: string) => pathForLocale(locale, path);

  return (
    <footer className="dg-footer">
      <div className="dg-page-shell dg-footer-inner">
        <div className="dg-footer-row">
          <div className="dg-footer-brand">
            <span className="dg-footer-wordmark">DocGen TW</span>
            <span>© 2026</span>
          </div>
          <nav className="dg-footer-links" aria-label={t(locale, "footer.aria_label")}>
            <Link href={href("/terms")}>{t(locale, "footer.terms")}</Link>
            <Link href={href("/privacy")}>{t(locale, "footer.privacy")}</Link>
            <Link href={href("/refund")}>{t(locale, "footer.refund")}</Link>
            <Link href={href("/disclaimer")}>{t(locale, "footer.disclaimer_link")}</Link>
            <Link href={href("/cases")}>{t(locale, "footer.cases")}</Link>
            <Link href={href("/contracts/new")}>{t(locale, "footer.new_contract")}</Link>
            <a href={`mailto:${COMPANY.email}`}>{t(locale, "footer.contact")}</a>
          </nav>
        </div>
        <div className="dg-footer-meta">
          <span lang="zh-Hant">{COMPANY.name}</span>｜{t(locale, "footer.tax_id")} {COMPANY.taxId}｜
          <span lang="zh-Hant">{COMPANY.address}</span>｜
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        </div>
        <div className="dg-footer-disclaimer">
          {t(locale, "footer.disclaimer_prefix")}<b>{t(locale, "footer.disclaimer_emphasis")}</b>
          {t(locale, "footer.disclaimer_suffix")}
          <Link href="/disclaimer#referral" className="dg-footer-inline-link">
            {t(locale, "footer.lawyer_link")}
          </Link>
          {t(locale, "footer.disclaimer_end")}
        </div>
      </div>
    </footer>
  );
}
