"use client";
import { Icon } from "./Icon";

export function LegalDisclaimer({ compact }: { compact?: boolean }) {
  if (compact)
    return (
      <div className="row gap-2" style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>
        <Icon name="alert" size={12} />
        <span>本平台產出之合約僅供一般用途參考，重大或複雜爭議請諮詢執業律師。</span>
      </div>
    );
  return (
    <div
      className="row gap-3"
      style={{
        padding: "14px 18px", borderRadius: "var(--radius)",
        background: "var(--amber-50)", border: "1px solid #f0d9a4", color: "#7a5a2a",
        alignItems: "flex-start",
      }}
    >
      <Icon name="fileWarn" size={18} style={{ marginTop: 2, color: "var(--amber-600)", flexShrink: 0 }} />
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
        <b style={{ color: "#5b3f10" }}>法律免責聲明</b>　本平台提供之合約模板與條款建議，係依中華民國現行法律一般情形編製，僅供一般參考用途。
        重大交易、跨境合作或具爭議性事項，建議委請執業律師審閱。本平台不負法律責任。
      </div>
    </div>
  );
}
