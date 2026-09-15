import Link from "next/link";
import { Icon } from "./Icon";
import { LegalBasisChip } from "./LegalBasisChip";
import type { Template } from "@/lib/templates";
import { DEFAULT_LOCALE, t, type Locale } from "@/lib/i18n/dict";
import { pathForLocale } from "@/lib/i18n/locale-shared";
import { TEMPLATE_CATALOG_EN } from "@/lib/i18n/template-catalog-en";

export function TemplateCard({
  tpl,
  locale = DEFAULT_LOCALE,
}: {
  tpl: Template;
  locale?: Locale;
}) {
  const href = pathForLocale(locale, `/templates/${tpl.id}`);
  const catalog = locale === "en" ? TEMPLATE_CATALOG_EN[tpl.id] : undefined;
  const name = catalog?.name ?? tpl.name;
  const description = catalog?.description ?? tpl.description;
  const category = catalog?.category ?? tpl.category;

  return (
    <article className="card card-hover dg-template-card">
      <div className="dg-template-card-header">
        <div className="dg-template-card-icon" aria-hidden="true">
          <Icon name={tpl.icon} size={20} />
        </div>
        <span className="chip chip-zinc" lang={locale === "en" ? "en" : "zh-Hant"}>{category}</span>
      </div>
      <div className="dg-template-card-copy">
        <h3 className="dg-subsection-title">
          <Link href={href} className="dg-template-card-title-link" lang={locale === "en" ? "en" : "zh-Hant"}>{name}</Link>
        </h3>
        {locale === "en" && <span lang="zh-Hant" className="dg-text-secondary">{tpl.name}</span>}
        <p className="dg-text-secondary" lang={locale === "en" ? "en" : "zh-Hant"}>{description}</p>
      </div>
      <div className="dg-template-card-legal" aria-label={`${name} ${t(locale, "template.legal_basis")}`}>
        {tpl.legal.slice(0, 3).map((c) => (
          <span key={c} lang="zh-Hant"><LegalBasisChip code={c} size="sm" /></span>
        ))}
      </div>
      <Link href={href} className="dg-template-card-link">
        <span>{t(locale, "template.view_and_use")}</span>
        <Icon name="arrowRight" size={15} />
      </Link>
    </article>
  );
}
