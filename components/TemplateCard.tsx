"use client";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { LegalBasisChip } from "./LegalBasisChip";
import type { Template } from "@/lib/templates";

export function TemplateCard({ tpl }: { tpl: Template }) {
  const router = useRouter();
  return (
    <div
      className="card card-hover"
      style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, cursor: "pointer" }}
      onClick={() => router.push(`/templates/${tpl.id}`)}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: "var(--primary-soft)", color: "var(--primary)",
            display: "grid", placeItems: "center",
          }}
        >
          <Icon name={tpl.icon} size={20} />
        </div>
        <span className="chip chip-zinc" style={{ fontSize: 11 }}>{tpl.category}</span>
      </div>
      <div>
        <h3 style={{ fontSize: 19, marginBottom: 4 }}>{tpl.name}</h3>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, lineHeight: 1.5 }}>{tpl.description}</p>
      </div>
      <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
        {tpl.legal.slice(0, 3).map((c) => <LegalBasisChip key={c} code={c} size="sm" />)}
      </div>
      <div
        className="row"
        style={{ justifyContent: "space-between", marginTop: 4, fontSize: 13, color: "var(--primary)", fontWeight: 500 }}
      >
        <span>查看法條 + 使用</span>
        <Icon name="arrowRight" size={15} />
      </div>
    </div>
  );
}
