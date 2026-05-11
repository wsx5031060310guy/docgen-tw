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
        <b style={{ color: "#5b3f10" }}>法律免責聲明</b>　DocGen TW 提供
        <b>文件自動化與風險提示</b>，並非執業律師、不取代法律意見。本平台輸出之合約模板與風險檢查結果，
        係依中華民國現行法律一般情形編製，僅供一般參考用途。重大金額、跨境、訴訟或客製條款，
        建議委請<a href="/disclaimer" style={{ color: "#5b3f10", textDecoration: "underline" }}>合作律師</a>審閱。
        因使用本平台所生之爭議，本平台不負法律責任。
      </div>
    </div>
  );
}
