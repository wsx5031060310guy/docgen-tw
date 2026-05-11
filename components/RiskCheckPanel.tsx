"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { LawyerReferralCTA } from "./LawyerReferralCTA";
import type { RiskFinding, RiskLevel } from "@/lib/risk-rules";

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

const LEVEL_STYLE: Record<RiskLevel, { bg: string; border: string; ink: string; chip: string; icon: string }> = {
  red: { bg: "#fde9e9", border: "#f1b5b5", ink: "#7a1f1f", chip: "#c4322a", icon: "alertOctagon" },
  yellow: { bg: "var(--amber-50)", border: "#f0d9a4", ink: "#7a5a2a", chip: "var(--amber-600)", icon: "alert" },
  "green-info": { bg: "#e8f5ed", border: "#bfe1c8", ink: "#1f5a35", chip: "#2e8b57", icon: "checkCircle" },
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
}: {
  templateId: string;
  values: Record<string, string>;
  context?: string;
}) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (!templateId || !values) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/risk-check", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ templateId, values }),
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
  }, [templateId, JSON.stringify(values)]);

  if (loading && !result) {
    return (
      <div className="card" style={{ padding: 16, fontSize: 13, color: "var(--ink-muted)" }}>
        <Icon name="loader" size={14} style={{ marginRight: 6 }} />
        分析合約風險中…
      </div>
    );
  }
  if (error) {
    return (
      <div className="card" style={{ padding: 16, fontSize: 13, color: "var(--ink-muted)" }}>
        風險檢查暫不可用：{error}
      </div>
    );
  }
  if (!result) return null;

  const s = LEVEL_STYLE[result.summary.level];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        className="card"
        style={{
          padding: 18, background: s.bg, border: `1px solid ${s.border}`,
          color: s.ink, borderRadius: "var(--radius)",
          display: "flex", flexDirection: "column", gap: 8,
        }}
      >
        <div className="row gap-2" style={{ alignItems: "center" }}>
          <Icon name={s.icon} size={16} style={{ color: s.chip }} />
          <b style={{ fontSize: 15 }}>風險檢查 · {LEVEL_LABEL[result.summary.level]}</b>
          <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.85 }}>
            紅 {result.summary.reds} · 黃 {result.summary.yellows}
          </span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{result.summary.oneliner}</div>
        <div style={{ fontSize: 11.5, opacity: 0.75, marginTop: 2 }}>
          ※ 此檢查為規則式自動分析，僅作風險提示，不構成法律意見。
        </div>
      </div>

      {result.findings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {result.findings.map((f) => {
            const fs = LEVEL_STYLE[f.level];
            return (
              <div
                key={f.id}
                className="card"
                style={{
                  padding: 14,
                  background: "var(--bg-elev)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                }}
              >
                <div className="row gap-2" style={{ alignItems: "center", marginBottom: 8 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      gap: 4,
                      alignItems: "center",
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: fs.bg,
                      color: fs.ink,
                      border: `1px solid ${fs.border}`,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <Icon name={fs.icon} size={10} />
                    {LEVEL_LABEL[f.level]}
                  </span>
                  <b style={{ fontSize: 14 }}>{f.title}</b>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--ink-soft)", marginBottom: 8 }}>
                  {f.detail}
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "var(--ink)" }}>
                  <b>建議：</b>{f.suggestion}
                </div>
                {f.legalBasis.length > 0 && (
                  <div className="row gap-2" style={{ marginTop: 8, flexWrap: "wrap" }}>
                    {f.legalBasis.map((b) => (
                      <span
                        key={b}
                        className="chip chip-mono"
                        style={{ fontSize: 11, padding: "2px 8px" }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {result.summary.needsLawyer && (
        <LawyerReferralCTA variant="card" context={context ?? templateId} />
      )}
    </div>
  );
}
