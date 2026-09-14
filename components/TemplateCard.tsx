import Link from "next/link";
import { Icon } from "./Icon";
import { LegalBasisChip } from "./LegalBasisChip";
import type { Template } from "@/lib/templates";

export function TemplateCard({ tpl }: { tpl: Template }) {
  const href = `/templates/${tpl.id}`;

  return (
    <article className="card card-hover dg-template-card">
      <div className="dg-template-card-header">
        <div className="dg-template-card-icon" aria-hidden="true">
          <Icon name={tpl.icon} size={20} />
        </div>
        <span className="chip chip-zinc">{tpl.category}</span>
      </div>
      <div className="dg-template-card-copy">
        <h3 className="dg-subsection-title">
          <Link href={href} className="dg-template-card-title-link">{tpl.name}</Link>
        </h3>
        <p className="dg-text-secondary">{tpl.description}</p>
      </div>
      <div className="dg-template-card-legal" aria-label={`${tpl.name}法條依據`}>
        {tpl.legal.slice(0, 3).map((c) => <LegalBasisChip key={c} code={c} size="sm" />)}
      </div>
      <Link href={href} className="dg-template-card-link">
        <span>查看法條 + 使用</span>
        <Icon name="arrowRight" size={15} />
      </Link>
    </article>
  );
}
