"use client";
import { useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { LawyerReferralCTA } from "@/components/LawyerReferralCTA";
import { t } from "@/lib/i18n/dict";
import type { RiskFinding, RiskLevel } from "@/lib/risk-rules";

const L = "en" as const;

type Result = {
  summary: { level: RiskLevel; reds: number; yellows: number; needsLawyer: boolean; oneliner: string };
  findings: RiskFinding[];
  chars: number;
  templateSuggestion?: { templateId: string; name: string } | null;
};

const LEVEL_STYLE: Record<RiskLevel, { bg: string; border: string; ink: string; chip: string }> = {
  red: { bg: "#fde9e9", border: "#f1b5b5", ink: "#7a1f1f", chip: "#c4322a" },
  yellow: { bg: "var(--amber-50)", border: "#f0d9a4", ink: "#7a5a2a", chip: "var(--amber-600)" },
  "green-info": { bg: "#e8f5ed", border: "#bfe1c8", ink: "#1f5a35", chip: "#2e8b57" },
};
const LEVEL_LABEL: Record<RiskLevel, string> = { red: "Red", yellow: "Yellow", "green-info": "Green" };

export default function CheckEn() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setErr(null);
    if (!text.trim()) return setErr("Please paste contract text");
    setBusy(true);
    try {
      const r = await fetch("/api/check-text", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setResult(j);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "32px 32px 16px", maxWidth: 960 }}>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            <Icon name="shieldCheck" size={13} /> {t(L, "check.tag")}
          </div>
          <h1 style={{ fontSize: 44, lineHeight: 1.1 }}>
            {t(L, "check.headline_pre")}
            <span style={{ fontFamily: "var(--font-italic)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>
              {t(L, "check.headline_italic")}
            </span>
            {t(L, "check.headline_post")}
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--ink-soft)", marginTop: 14 }}>
            DocGen TW runs <b>15 keyword + heuristic rules</b> targeted at Taiwan law:
            interest cap (Civil Code §205), excessive penalty (§250/§252), unlimited NDA,
            unilateral termination, foreign jurisdiction, missing venue clause, etc.
            <b> Free, no signup, contents are not stored</b> unless you opt-in to a shareable link.
          </p>
        </section>

        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 960 }}>
          <div className="dg-fields-2col" style={{ gap: 16, alignItems: "flex-start" }}>
            <div className="card" style={{
              padding: 16, background: "var(--bg-elev)", border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
            }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Paste contract text</label>
              <textarea
                className="input"
                rows={14}
                style={{ resize: "vertical", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7, marginTop: 8 }}
                placeholder={t(L, "check.placeholder")}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="row" style={{ marginTop: 10, justifyContent: "space-between", fontSize: 12, color: "var(--ink-muted)" }}>
                <span>{text.length.toLocaleString()} / 50,000 {t(L, "check.charcount")}</span>
                {(text || result) && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setText(""); setResult(null); }}>
                    {t(L, "check.clear")}
                  </button>
                )}
              </div>
              {err && <div className="field-error" style={{ marginTop: 8 }}><Icon name="alert" size={12} />{err}</div>}
              <button
                className="btn btn-primary btn-lg"
                style={{ marginTop: 14, width: "100%" }}
                onClick={run}
                disabled={busy || !text.trim()}
              >
                {busy ? "Analyzing…" : t(L, "check.cta")}
                <Icon name="arrowRight" size={14} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {!result && !busy && (
                <div className="card" style={{ padding: 20, color: "var(--ink-muted)", fontSize: 14, lineHeight: 1.7 }}>
                  <Icon name="info" size={14} /> {t(L, "check.idle")}
                </div>
              )}
              {result && (
                <>
                  <div className="card" style={{
                    padding: 18, background: LEVEL_STYLE[result.summary.level].bg,
                    border: `1px solid ${LEVEL_STYLE[result.summary.level].border}`,
                    color: LEVEL_STYLE[result.summary.level].ink,
                    borderRadius: "var(--radius)",
                  }}>
                    <div className="row gap-2" style={{ alignItems: "center" }}>
                      <Icon
                        name={result.summary.level === "red" ? "alertOctagon" : result.summary.level === "yellow" ? "alert" : "checkCircle"}
                        size={16}
                        style={{ color: LEVEL_STYLE[result.summary.level].chip }}
                      />
                      <b style={{ fontSize: 15 }}>{LEVEL_LABEL[result.summary.level]}</b>
                      <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.85 }}>
                        Red {result.summary.reds} · Yellow {result.summary.yellows}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>{result.summary.oneliner}</div>
                  </div>
                  {result.findings.map((f) => {
                    const fs = LEVEL_STYLE[f.level];
                    return (
                      <div key={f.id} className="card" style={{
                        padding: 14, background: "var(--bg-elev)",
                        border: "1px solid var(--line)", borderRadius: "var(--radius)",
                      }}>
                        <div className="row gap-2" style={{ alignItems: "center", marginBottom: 6 }}>
                          <span style={{
                            display: "inline-flex", padding: "2px 8px", borderRadius: 999,
                            background: fs.bg, color: fs.ink, border: `1px solid ${fs.border}`,
                            fontSize: 11, fontWeight: 600,
                          }}>
                            {LEVEL_LABEL[f.level]}
                          </span>
                          <b style={{ fontSize: 14 }}>{f.title}</b>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: 6 }}>{f.detail}</div>
                        <div style={{ fontSize: 12.5, color: "var(--ink)" }}><b>Suggested fix:</b> {f.suggestion}</div>
                        {f.legalBasis.length > 0 && (
                          <div className="row gap-2" style={{ marginTop: 8, flexWrap: "wrap" }}>
                            {f.legalBasis.map((b) => (
                              <span key={b} className="chip chip-mono" style={{ fontSize: 11, padding: "2px 8px" }}>{b}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {result.summary.needsLawyer && (
                    <LawyerReferralCTA variant="card" context="EN-pasted contract risk check (red findings)" />
                  )}
                  {result.templateSuggestion && (
                    <div className="card" style={{
                      padding: 16, background: "#eef4ff",
                      border: "1px solid #b9cdf2", color: "#1f3a5a", borderRadius: "var(--radius)",
                    }}>
                      <div className="row gap-2"><Icon name="sparkles" size={14} /><b style={{ fontSize: 14 }}>Recommended template</b></div>
                      <div style={{ fontSize: 13, lineHeight: 1.65, marginTop: 6 }}>
                        Closest DocGen template: <b>{result.templateSuggestion.name}</b>. Re-issuing from a
                        compliant template fixes most red flags in one pass.
                      </div>
                      <Link href={`/en/contracts/new?tpl=${result.templateSuggestion.templateId}`} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                        <Icon name="fileText" size={11} />Use template
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        <section className="container" style={{ padding: "12px 32px 64px", maxWidth: 960 }}>
          <LegalDisclaimer />
        </section>

        <Footer />
      </main>
    </>
  );
}
