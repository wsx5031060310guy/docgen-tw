"use client";

import { Icon } from "./Icon";

export type SettingsApiKey = {
  id: string;
  prefix: string;
  label: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type SettingsLoadState = "loading" | "ready" | "empty" | "error";

export function SettingsApiKeys({
  keys,
  loadState,
  loadError,
  newKeyLabel,
  issued,
  busy,
  actionError,
  copyStatus,
  onLabelChange,
  onIssue,
  onRevoke,
  onCopy,
  onRetry,
}: {
  keys: SettingsApiKey[];
  loadState: SettingsLoadState;
  loadError: string | null;
  newKeyLabel: string;
  issued: { rawKey: string; prefix: string } | null;
  busy: boolean;
  actionError: string | null;
  copyStatus: "success" | "error" | null;
  onLabelChange: (value: string) => void;
  onIssue: () => void;
  onRevoke: (id: string) => void;
  onCopy: () => void;
  onRetry: () => void;
}) {
  return (
    <section className="card dg-card-body dg-settings-card" aria-labelledby="settings-api-keys-title" aria-busy={busy || undefined}>
      <div className="dg-settings-card-heading">
        <Icon name="hash" size={16} />
        <h2 id="settings-api-keys-title" className="dg-section-title">API Keys</h2>
      </div>
      <p className="dg-text-secondary">
        用於從其他系統（n8n、Make 或你的後端）程式化建立合約。每把 key 共用相同的每月配額。
      </p>
      <div>
        <p className="field-label">呼叫範例</p>
        <pre className="dg-code-block" tabIndex={0} aria-label="API 呼叫範例"><code>{`curl -X POST https://docgen-tw.vercel.app/api/v1/contracts \\
  -H "Authorization: Bearer dk_xxxxxxxx..." \\
  -H "Content-Type: application/json" \\
  -d '{ "templateId": "freelance", "values": {...}, "partyASignature": "data:image/png;base64,..." }'`}</code></pre>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="settings-key-label">新 Key 標籤（選填）</label>
        <div className="dg-settings-field-action">
          <input
            id="settings-key-label"
            className="input"
            placeholder="例：n8n production"
            value={newKeyLabel}
            onChange={(event) => onLabelChange(event.target.value)}
            aria-describedby="settings-key-label-help"
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={onIssue} disabled={busy} aria-busy={busy || undefined}>
            <Icon name={busy ? "loader" : "plus"} size={11} className={busy ? "spin" : ""} />
            {busy ? "處理中…" : "產生 Key"}
          </button>
        </div>
        <p id="settings-key-label-help" className="field-help">標籤只用來辨識用途，不會成為 API key 的一部分。</p>
      </div>

      {issued && (
        <div className="dg-notice dg-notice--warning dg-settings-issued-key" role="status">
          <strong>新 API key（只顯示這一次，請妥善保存）</strong>
          <code className="dg-settings-raw-key">{issued.rawKey}</code>
          <button type="button" className="btn btn-soft btn-sm" onClick={onCopy} disabled={busy}>
            <Icon name="copy" size={11} />複製
          </button>
          {copyStatus === "success" && <span className="dg-helper" role="status">已複製到剪貼簿。</span>}
          {copyStatus === "error" && <span className="field-error" role="alert">複製失敗，請手動選取上方 key。</span>}
        </div>
      )}

      {actionError && <div className="dg-notice dg-notice--error" role="alert"><Icon name="alert" size={12} />{actionError}</div>}

      <div className="dg-settings-key-list" aria-label="已建立的 API keys">
        {loadState === "loading" && keys.length === 0 && (
          <div className="dg-settings-list-state dg-notice dg-notice--info" role="status" aria-live="polite" aria-busy="true">
            <Icon name="loader" size={12} className="spin" />正在載入 API keys…
          </div>
        )}
        {loadState === "error" && (
          <div className="dg-settings-list-state dg-notice dg-notice--error" role="alert">
            <span>無法載入 API keys：{loadError}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>重新載入</button>
          </div>
        )}
        {loadState === "empty" && (
          <div className="dg-settings-list-state" role="status">尚未建立 API key。</div>
        )}
        {loadState === "loading" && keys.length > 0 && (
          <div className="dg-helper" role="status" aria-live="polite" aria-busy="true">正在更新 API key 列表…</div>
        )}
        {keys.map((key) => (
          <div key={key.id} className="dg-list-item dg-settings-key-row">
            <div className="dg-settings-key-main">
              <code>{key.prefix}…</code>
              {key.label && <span className="chip chip-zinc">{key.label}</span>}
              {key.revokedAt && <span className="chip chip-bad">已撤銷</span>}
            </div>
            <div className="dg-settings-key-meta">
              <span>建立 {new Date(key.createdAt).toLocaleDateString("zh-Hant")}</span>
              {key.lastUsedAt && <span>最後使用 {new Date(key.lastUsedAt).toLocaleDateString("zh-Hant")}</span>}
              {!key.revokedAt && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRevoke(key.id)} disabled={busy}>
                  撤銷
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
