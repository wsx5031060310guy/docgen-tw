"use client";
import { Icon } from "./Icon";

type Variant = "inline" | "card" | "footer";

export function LawyerReferralCTA({
  variant = "inline",
  context,
}: {
  variant?: Variant;
  context?: string;
}) {
  const href =
    context && context.trim()
      ? `/disclaimer?topic=${encodeURIComponent(context)}#referral`
      : `/disclaimer#referral`;
  // Reuse the variable name so the rest of the file stays unchanged.
  const mailto = href;

  if (variant === "footer") {
    return (
      <a href={mailto} style={{ color: "var(--ink-muted)", fontSize: 13 }}>
        律師轉介
      </a>
    );
  }

  if (variant === "card") {
    return (
      <div
        className="card"
        style={{
          padding: 18,
          background: "var(--bg-elev)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div className="row gap-2" style={{ alignItems: "center" }}>
          <Icon name="scale" size={16} style={{ color: "var(--primary)" }} />
          <b style={{ fontSize: 14 }}>需要執業律師審閱？</b>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
          DocGen TW 僅提供文件自動化與風險提示，不取代律師意見。
          若合約金額龐大、跨境、或涉及訴訟風險，建議由合作律師審閱。
        </p>
        <a href={mailto} className="btn btn-soft btn-sm" style={{ alignSelf: "flex-start" }}>
          <Icon name="mail" size={13} />
          申請律師轉介
        </a>
      </div>
    );
  }

  return (
    <a href={mailto} className="btn btn-soft btn-sm">
      <Icon name="scale" size={13} />
      申請律師轉介
    </a>
  );
}
