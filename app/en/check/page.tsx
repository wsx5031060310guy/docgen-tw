"use client";

import { useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { LawyerReferralCTA } from "@/components/LawyerReferralCTA";
import { RiskFindingCard, RISK_LEVEL_CLASS } from "@/components/RiskFindingCard";
import { UIState } from "@/components/UIState";
import { t } from "@/lib/i18n/dict";
import type { RiskFinding, RiskLevel } from "@/lib/risk-rules";

const L = "en" as const;

type Result = {
  summary: { level: RiskLevel; reds: number; yellows: number; needsLawyer: boolean; oneliner: string };
  findings: RiskFinding[];
  chars: number;
  templateSuggestion?: { templateId: string; name: string } | null;
};

const LEVEL_LABEL: Record<RiskLevel, string> = {
  red: "Red flag",
  yellow: "Review recommended",
  "green-info": "No rule-based red flags",
};

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
      const response = await fetch("/api/check-text", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      setResult(data);
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const summaryStyle = result ? RISK_LEVEL_CLASS[result.summary.level] : null;

  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-check-page">
        <header className="dg-page-shell dg-check-shell dg-check-hero">
          <div className="dg-eyebrow dg-check-eyebrow">
            <Icon name="shieldCheck" size={13} /> {t(L, "check.tag")}
          </div>
          <h1 className="dg-page-title dg-check-title">
            {t(L, "check.headline_pre")}
            <span className="dg-check-title-accent">{t(L, "check.headline_italic")}</span>
            {t(L, "check.headline_post")}
          </h1>
          <p className="dg-body dg-check-lead">
            DocGen TW runs <strong>15 keyword and heuristic rules</strong> for Taiwan law, including the Civil Code §205 interest cap,
            excessive penalties, unlimited confidentiality, unilateral termination, foreign jurisdiction, and missing venue clauses.
            <strong> Free, no signup, and contents are not stored.</strong>
          </p>
        </header>

        <section className="dg-page-shell dg-check-shell dg-check-workspace" aria-label="Contract risk analysis tool">
          <div className="dg-check-grid">
            <div className="card dg-card-compact dg-check-form-card">
              <div className="dg-check-field-heading">
                <label className="field-label dg-check-label" htmlFor="contract-text-en">Paste contract text</label>
              </div>
              <textarea
                id="contract-text-en"
                className="textarea dg-check-textarea"
                rows={14}
                placeholder={t(L, "check.placeholder")}
                value={text}
                onChange={(event) => setText(event.target.value)}
                aria-describedby={`contract-text-en-help${err ? " contract-text-en-error" : ""}`}
                aria-invalid={Boolean(err) || undefined}
              />
              <div id="contract-text-en-help" className="dg-check-text-meta">
                <span>{text.length.toLocaleString("en")} / 50,000 {t(L, "check.charcount")}</span>
                {(text || result) && (
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => {
                      setText("");
                      setResult(null);
                      setErr(null);
                    }}
                  >
                    {t(L, "check.clear")}
                  </button>
                )}
              </div>
              {err && (
                <div id="contract-text-en-error" className="field-error dg-check-error" role="alert">
                  <Icon name="alert" size={12} />{err}
                </div>
              )}
              <button
                className="btn btn-primary btn-lg dg-check-submit"
                type="button"
                onClick={run}
                disabled={busy || !text.trim()}
                aria-busy={busy || undefined}
              >
                {busy ? "Analyzing…" : t(L, "check.cta")}
                <Icon name={busy ? "loader" : "arrowRight"} size={14} className={busy ? "spin" : undefined} />
              </button>
            </div>

            <div className="dg-check-results" aria-busy={busy || undefined}>
              <h2 className="dg-visually-hidden">Risk-check results</h2>
              {!result && !busy && (
                <UIState status="empty" title="Waiting for a contract" description={t(L, "check.idle")} />
              )}
              {!result && busy && (
                <UIState status="loading" title="Analyzing the contract" description="Long contracts can take a moment. Keep this page open." />
              )}
              {result && summaryStyle && (
                <>
                  {busy && (
                    <div className="dg-notice dg-notice--info dg-risk-status" role="status" aria-live="polite">
                      <Icon name="loader" size={14} className="spin" />
                      <span>Analyzing again; the previous result remains visible.</span>
                    </div>
                  )}
                  <div className={`dg-notice dg-notice--${summaryStyle.notice} dg-risk-summary`}>
                    <div className="dg-risk-summary__header">
                      <Icon name={summaryStyle.icon} size={16} />
                      <strong className="dg-risk-summary__title">{LEVEL_LABEL[result.summary.level]}</strong>
                      <span className="dg-risk-summary__counts">Red {result.summary.reds} · Yellow {result.summary.yellows}</span>
                    </div>
                    <p className="dg-risk-summary__oneliner" lang="zh-Hant">{result.summary.oneliner}</p>
                  </div>
                  {result.findings.length > 0 ? (
                    <div className="dg-risk-findings" lang="zh-Hant">
                      {result.findings.map((finding) => <RiskFindingCard key={finding.id} finding={finding} />)}
                    </div>
                  ) : (
                    <div className="dg-notice dg-notice--success dg-risk-status" role="status">
                      <Icon name="checkCircle" size={14} />
                      <span>No rule-based red flags detected. Lawyer review is still recommended for important transactions.</span>
                    </div>
                  )}
                  {result.summary.needsLawyer && (
                    <LawyerReferralCTA
                      variant="card"
                      context="EN-pasted contract risk check (red findings)"
                      locale={L}
                    />
                  )}
                  {result.templateSuggestion && (
                    <section className="dg-notice dg-notice--info dg-check-suggestion" aria-labelledby="template-suggestion-title-en">
                      <h2 id="template-suggestion-title-en" className="dg-subsection-title dg-check-card-heading">
                        <Icon name="sparkles" size={14} />Recommended template
                      </h2>
                      <p>
                        The closest DocGen template is <strong lang="zh-Hant">{result.templateSuggestion.name}</strong>.
                        Reissuing from a compliant template can address many common red flags in one pass.
                      </p>
                      <Link href={`/contracts/new?tpl=${result.templateSuggestion.templateId}`} className="btn btn-primary btn-sm">
                        <Icon name="fileText" size={11} />Use template
                      </Link>
                    </section>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        <section className="dg-page-shell dg-check-shell dg-check-disclaimer">
          <LegalDisclaimer locale={L} />
        </section>
      </main>
      <Footer locale={L} />
    </>
  );
}
