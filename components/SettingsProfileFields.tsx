"use client";

import { Icon } from "./Icon";

export type SettingsProfile = {
  uid: string;
  email: string | null;
  plan: string;
  periodEnd: string | null;
  webhookUrl: string | null;
  webhookSecret: string | null;
};

type TestResult = { ok: boolean; status?: number; reason?: string };

export function SettingsProfileFields({
  profile,
  email,
  webhookUrl,
  webhookSecret,
  busy,
  saveMessage,
  saveError,
  testResult,
  magicEmail,
  magicBusy,
  magicSent,
  magicError,
  onEmailChange,
  onWebhookUrlChange,
  onWebhookSecretChange,
  onRandomiseSecret,
  onSave,
  onMagicEmailChange,
  onSendMagic,
}: {
  profile: SettingsProfile;
  email: string;
  webhookUrl: string;
  webhookSecret: string;
  busy: boolean;
  saveMessage: string | null;
  saveError: string | null;
  testResult: TestResult | null;
  magicEmail: string;
  magicBusy: boolean;
  magicSent: string | null;
  magicError: string | null;
  onEmailChange: (value: string) => void;
  onWebhookUrlChange: (value: string) => void;
  onWebhookSecretChange: (value: string) => void;
  onRandomiseSecret: () => void;
  onSave: (testWebhook: boolean) => void;
  onMagicEmailChange: (value: string) => void;
  onSendMagic: () => void;
}) {
  return (
    <>
      <section className="card dg-card-body dg-settings-card" aria-labelledby="settings-identity-title">
        <div className="dg-settings-card-heading">
          <Icon name="hash" size={16} />
          <h2 id="settings-identity-title" className="dg-section-title">身分與方案</h2>
        </div>
        <dl className="dg-settings-identity">
          <div>
            <dt>使用者識別碼</dt>
            <dd><code className="dg-settings-uid">{profile.uid}</code></dd>
          </div>
          <div>
            <dt>目前方案</dt>
            <dd>
              {profile.plan === "PRO" ? "PRO" : "FREE"}
              {profile.periodEnd && profile.plan === "PRO" && (
                <> · 至 {new Date(profile.periodEnd).toLocaleDateString("zh-Hant")}</>
              )}
            </dd>
          </div>
        </dl>
        <p className="dg-helper">
          uid 存在你的瀏覽器 cookie。換瀏覽器或清除 cookie 會視為新使用者；如需跨裝置帶入 Pro，請填寫 Email 並聯絡客服轉移。
        </p>
      </section>

      <section className="card dg-card-body dg-settings-card" aria-labelledby="settings-email-title">
        <div className="dg-settings-card-heading">
          <Icon name="mail" size={16} />
          <h2 id="settings-email-title" className="dg-section-title">Email</h2>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="settings-email">收件 Email</label>
          <input
            id="settings-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            aria-describedby="settings-email-help"
          />
          <p id="settings-email-help" className="field-help">
            用於付款收據、Pro 啟用憑據及跨裝置轉移時的身分確認。
          </p>
        </div>
      </section>

      <section
        className="card dg-card-body dg-settings-card"
        aria-labelledby="settings-webhook-title"
        aria-busy={busy || undefined}
      >
        <div className="dg-settings-card-heading">
          <Icon name="zap" size={16} />
          <h2 id="settings-webhook-title" className="dg-section-title">Webhook 通知</h2>
        </div>
        <p className="dg-text-secondary">
          支援所有接受 POST JSON 的 endpoint：Slack incoming webhook、Discord、Make.com、Zapier、n8n、自家 server。
          觸發事件：<code>contract.signed.full</code>、<code>milestone.overdue</code>、<code>milestone.due</code>。
        </p>
        <div className="field">
          <label className="field-label" htmlFor="settings-webhook-url">Webhook URL</label>
          <input
            id="settings-webhook-url"
            className="input"
            type="url"
            inputMode="url"
            placeholder="https://hooks.slack.com/services/T0/B0/xxxx"
            value={webhookUrl}
            onChange={(event) => onWebhookUrlChange(event.target.value)}
            aria-describedby="settings-webhook-url-help"
          />
          <p id="settings-webhook-url-help" className="field-help">系統會將合約及 milestone 事件以 POST JSON 傳送到此網址。</p>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="settings-webhook-secret">Webhook Secret（選填）</label>
          <p id="settings-webhook-secret-help" className="field-help">
            填寫後，系統會用 HMAC-SHA256 簽名 body，並加上 X-DocGen-Signature: sha256=… 標頭。
          </p>
          <div className="dg-settings-field-action">
            <input
              id="settings-webhook-secret"
              className="input"
              placeholder="可留空"
              value={webhookSecret}
              onChange={(event) => onWebhookSecretChange(event.target.value)}
              aria-describedby="settings-webhook-secret-help"
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={onRandomiseSecret}>
              產一組
            </button>
          </div>
        </div>
        <div className="dg-actions">
          <button type="button" className="btn btn-primary" disabled={busy} aria-busy={busy || undefined} onClick={() => onSave(false)}>
            {busy ? "儲存中…" : "儲存設定"}
          </button>
          <button type="button" className="btn btn-soft" disabled={busy || !webhookUrl} aria-busy={busy || undefined} onClick={() => onSave(true)}>
            <Icon name={busy ? "loader" : "send"} size={12} className={busy ? "spin" : ""} />
            {busy ? "處理中…" : "儲存並發測試"}
          </button>
        </div>
        {saveMessage && <div className="dg-notice dg-notice--success" role="status">{saveMessage}</div>}
        {testResult && (
          <div className={`dg-notice dg-notice--${testResult.ok ? "success" : "error"}`} role={testResult.ok ? "status" : "alert"}>
            {testResult.ok
              ? `✓ 測試 webhook 成功（HTTP ${testResult.status}）`
              : `✗ 測試失敗：${testResult.reason}${testResult.status ? ` (HTTP ${testResult.status})` : ""}`}
          </div>
        )}
        {saveError && <div className="dg-notice dg-notice--error" role="alert"><Icon name="alert" size={12} />{saveError}</div>}
      </section>

      <section
        className="card dg-card-body dg-settings-card"
        aria-labelledby="settings-magic-title"
        aria-busy={magicBusy || undefined}
      >
        <div className="dg-settings-card-heading">
          <Icon name="lock" size={16} />
          <h2 id="settings-magic-title" className="dg-section-title">跨裝置登入（Email Magic Link）</h2>
        </div>
        <p className="dg-text-secondary">
          系統會寄送一次性登入連結；開啟後，本瀏覽器 cookie 會綁定至該 Email 對應的同一 uid，換裝置仍可保留 Pro 狀態與合約資料。
        </p>
        <div className="field">
          <label className="field-label" htmlFor="settings-magic-email">登入 Email</label>
          <div className="dg-settings-field-action">
            <input
              id="settings-magic-email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={magicEmail}
              onChange={(event) => onMagicEmailChange(event.target.value)}
              aria-describedby="settings-magic-email-help settings-magic-feedback"
              aria-invalid={Boolean(magicError) || undefined}
            />
            <button
              type="button"
              className="btn btn-soft"
              onClick={onSendMagic}
              disabled={!magicEmail || magicBusy}
              aria-busy={magicBusy || undefined}
            >
              <Icon name={magicBusy ? "loader" : "send"} size={12} className={magicBusy ? "spin" : ""} />
              {magicBusy ? "發送中…" : "寄送登入連結"}
            </button>
          </div>
          <p id="settings-magic-email-help" className="field-help">登入連結 15 分鐘內有效，且只能使用一次。</p>
          <div id="settings-magic-feedback">
            {magicSent && <div className="dg-notice dg-notice--success" role="status">✓ {magicSent}</div>}
            {magicError && <div className="dg-notice dg-notice--error" role="alert"><Icon name="alert" size={11} />{magicError}</div>}
          </div>
        </div>
      </section>
    </>
  );
}
