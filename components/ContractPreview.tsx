"use client";
import React from "react";
import { LegalBasisChip } from "./LegalBasisChip";
import { fillTemplate, type Template, type Values } from "@/lib/templates";
import { todayMinguo } from "@/lib/numberToChinese";

const ZH_NUM = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十"];
const numberToZh = (n: number) => ZH_NUM[n] || String(n);

function renderClause(text: string) {
  const parts = text.split(/(__+)/g);
  return parts.map((p, i) =>
    /^_+$/.test(p) ? (
      <span key={i} style={{ color: "#bba892", borderBottom: "1px dotted #c4b89e", padding: "0 2px" }}>

      </span>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}

export function ContractPreview({
  template,
  values,
  sigA,
  sigB,
  signedA,
  signedB,
  paper = true,
  stamp = true,
  scale = 1,
}: {
  template: Template;
  values: Values;
  sigA?: string;
  sigB?: string;
  signedA?: string;
  signedB?: string;
  paper?: boolean;
  stamp?: boolean;
  scale?: number;
}) {
  const clauses = template.clauses(values);
  const partyA = values.party_a_name || "___________";
  const partyB = values.party_b_name || "___________";

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
      <div
        className={paper ? "paper" : ""}
        style={{
          width: 720,
          minHeight: 1020,
          padding: "70px 80px 80px",
          boxShadow: paper
            ? "0 1px 0 rgba(255,255,255,0.5) inset, 0 12px 36px rgba(20,29,68,0.10), 0 2px 6px rgba(20,29,68,0.05)"
            : "var(--shadow-md)",
          background: paper ? undefined : "var(--bg-elev)",
          color: paper ? "#1a1612" : "var(--ink)",
          position: "relative",
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          borderRadius: 4,
          fontFamily: paper ? "var(--font-serif)" : "var(--font-sans)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 36, paddingBottom: 20, borderBottom: "1px solid rgba(0,0,0,0.12)" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "#856b4a", marginBottom: 8 }}>
            DOCGEN TW · 電子契約
          </div>
          <h1 style={{ fontSize: 30, fontFamily: "var(--font-serif)", letterSpacing: "0.18em", margin: 0 }}>
            {template.name}
          </h1>
          <div style={{ marginTop: 14, fontSize: 13, color: "#6b5c45" }}>
            立契約書人 　 {partyA}　（甲方） 　·　 {partyB}　（乙方）
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, fontSize: 14.5, lineHeight: 1.85 }}>
          {clauses.map((c) => (
            <div key={c.n} style={{ position: "relative" }}>
              <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, margin: "0 0 6px", letterSpacing: "0.06em" }}>
                第 {numberToZh(c.n)} 條　{c.title}
              </h4>
              <div style={{ whiteSpace: "pre-wrap", textIndent: "2em" }}>
                {renderClause(fillTemplate(c.body, values))}
              </div>
              {c.ref.length > 0 && (
                <div className="row" style={{ gap: 4, flexWrap: "wrap", marginTop: 6, marginLeft: "2em", fontFamily: "var(--font-sans)" }}>
                  <span style={{ fontSize: 11, color: "#9a8868", marginRight: 4 }}>依據</span>
                  {c.ref.map((r) => <LegalBasisChip key={r} code={r} size="sm" />)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 60, paddingTop: 30, borderTop: "1px solid rgba(0,0,0,0.12)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 50 }}>
          {[
            { label: "甲方（委任 / 出資方）", name: partyA, sig: sigA, signed: signedA },
            { label: "乙方（受任 / 受聘方）", name: partyB, sig: sigB, signed: signedB },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, color: "#9a8868", marginBottom: 8, letterSpacing: "0.05em" }}>{s.label}</div>
              <div style={{ height: 70, borderBottom: "1px solid rgba(0,0,0,0.4)", position: "relative", marginBottom: 6 }}>
                {s.sig ? (
                  <img src={s.sig} alt="signature" style={{ height: "100%", maxWidth: "100%", objectFit: "contain", filter: "contrast(1.1)" }} />
                ) : (
                  <span
                    style={{
                      color: "#c4b89e",
                      fontFamily: "var(--font-italic)",
                      fontStyle: "italic",
                      fontSize: 22,
                      position: "absolute",
                      bottom: 8,
                    }}
                  >
                    signature
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13 }}>{s.name}</div>
              {s.signed && (
                <div style={{ fontSize: 11, color: "#9a8868", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                  {s.signed}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 36, fontSize: 13, color: "#6b5c45", textAlign: "center" }}>
          立契約書日期： {values.sign_date || todayMinguo()}
        </div>

        {stamp && (signedA || signedB) && (
          <div className="stamp" style={{ position: "absolute", right: 60, top: 200, ["--stamp-size" as string]: "120px" }}>
            <div className="stamp-line1">DOCGEN</div>
            <div className="stamp-star">✦</div>
            <div className="stamp-line2">已簽署</div>
          </div>
        )}
      </div>
    </div>
  );
}
