"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { LawyerReferralCTA } from "./LawyerReferralCTA";
import type { RiskFinding, RiskLevel } from "@/lib/risk-rules";

type HeadingLevel = 2 | 3 | 4;

type CheckResult = {
  summary: {
    level: RiskLevel;
    reds: number;
    yellows: number;
    needsLawyer: boolean;
    oneliner: string;
  };
  findings: RiskFinding[];
};

const LEVEL_STYLE: Record<RiskLevel, { notice: string; chip: string; icon: string }> = {
  red: { notice: "error", chip: "chip-bad", icon: "alertOctagon" },
  yellow: { notice: "warning", chip: "chip-warn", icon: "alert" },
  "green-info": { notice: "success", chip: "chip-good", icon: "checkCircle" },
};

const LEVEL_LABEL: Record<RiskLevel, string> = {
  red: "紅燈",
  yellow: "黃燈",
  "green-info": "綠燈",
};

export function RiskCheckPanel({
  templateId,
  values,
  context,
  headingLevel,
}: {
  templateId: string;
  values: Record<string, string>;
  context?: string;
  headingLevel?: HeadingLevel;
}) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestBody = JSON.stringify({ templateId, values });

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (!templateId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/risk-check", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: requestBody,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as CheckResult;
        if (!cancelled) setResult(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400); // debounce 400ms
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [templateId, requestBody]);

  if (loading && !result) {
    return (
      <div className="dg-notice dg-notice--info dg-risk-status" role="status" aria-live="polite" aria-busy="true">
        <Icon name="loader" size={14} className="spin" />
        <span>分析合約風險中…</span>
      </div>
    );
  }
  if (error && !result) {
    return (
      <div className="dg-notice dg-notice--error dg-risk-status" role="alert">
        <Icon name="alertOctagon" size={14} />
        <span>風險檢查暫不可用：{error}</span>
      </div>
    );
  }
  if (!result) return null;

  const s = LEVEL_STYLE[result.summary.level];
  const HeadingTag = headingLevel ? (`h${headingLevel}` as "h2" | "h3" | "h4") : "p";

  return (
    <div className="dg-risk-panel" aria-busy={loading || undefined}>
      {loading && (
        <div className="dg-notice dg-notice--info dg-risk-status" role="status" aria-live="polite">
          <Icon name="loader" size={14} className="spin" />
          <span>重新分析中…目前先顯示上次結果。</span>
        </div>
      )}
      {error && (
        <div className="dg-notice dg-notice--error dg-risk-status" role="alert">
          <Icon name="alertOctagon" size={14} />
          <span>重新分析失敗：{error}。目前顯示上次結果。</span>
        </div>
      )}
      <div
        className={`dg-notice dg-notice--${s.notice} dg-risk-summary`}
      >
        <div className="dg-risk-summary__header">
          <Icon name={s.icon} size={16} />
          <HeadingTag className="dg-risk-summary__title">
            風險檢查 · {LEVEL_LABEL[result.summary.level]}
          </HeadingTag>
          <span className="dg-risk-summary__counts">
            紅 {result.summary.reds} · 黃 {result.summary.yellows}
          </span>
        </div>
        <p className="dg-risk-summary__oneliner">{result.summary.oneliner}</p>
        <p className="dg-risk-summary__helper">
          ※ 此檢查為規則式自動分析，僅作風險提示，不構成法律意見。
        </p>
      </div>

      {result.findings.length > 0 ? (
        <div className="dg-risk-findings">
          {result.findings.map((f) => {
            const fs = LEVEL_STYLE[f.level];
            return (
              <div key={f.id} className="card dg-risk-finding">
                <div className="dg-risk-finding__header">
                  <span className={`chip ${fs.chip} dg-risk-finding__level`}>
                    <Icon name={fs.icon} size={10} />
                    {LEVEL_LABEL[f.level]}
                  </span>
                  <strong className="dg-risk-finding__title">{f.title}</strong>
                </div>
                <p className="dg-risk-finding__detail">
                  {f.detail}
                </p>
                <p className="dg-risk-finding__suggestion">
                  <b>建議：</b>{f.suggestion}
                </p>
                {f.legalBasis.length > 0 && (
                  <div className="dg-risk-finding__legal">
                    {f.legalBasis.map((b) => (
                      <span key={b} className="chip chip-mono dg-risk-finding__basis">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dg-notice dg-notice--success dg-risk-status" role="status">
          <Icon name="checkCircle" size={14} />
          <span>未發現符合規則的風險項目。</span>
        </div>
      )}

      {result.summary.needsLawyer && (
        <LawyerReferralCTA variant="card" context={context ?? templateId} headingLevel={headingLevel} />
      )}
    </div>
  );
}
