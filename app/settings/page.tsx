"use client";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { BillingBanner } from "@/components/BillingBanner";

type Profile = {
  uid: string;
  email: string | null;
  plan: string;
  periodEnd: string | null;
  webhookUrl: string | null;
  webhookSecret: string | null;
};

export default function SettingsPage() {
  const [p, setP] = useState<Profile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; status?: number; reason?: string } | null>(null);

  const [email, setEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  useEffect(() => {
    fetch("/api/billing/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Profile | null) => {
        if (j) {
          setP(j);
          setEmail(j.email ?? "");
          setWebhookUrl(j.webhookUrl ?? "");
          setWebhookSecret(j.webhookSecret ?? "");
        }
      })
      .catch((e) => setErr((e as Error).message));
  }, []);

  async function save(testWebhook = false) {
    setErr(null);
    setTestResult(null);
    setBusy(true);
    try {
      const r = await fetch("/api/billing/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, webhookUrl, webhookSecret, testWebhook }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setP(j.profile);
      if (j.testResult) setTestResult(j.testResult);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function randomiseSecret() {
    const arr = new Uint8Array(24);
    window.crypto.getRandomValues(arr);
    setWebhookSecret(Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join(""));
  }

  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "32px 32px 16px", maxWidth: 760 }}>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            <Icon name="users" size={13} /> 設定
          </div>
          <h1 style={{ fontSize: 36 }}>帳號 & 整合</h1>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 8, lineHeight: 1.7 }}>
            本平台以瀏覽器 cookie 識別身分（無註冊登入）。可選擇綁定 Email 收取 Pro 啟用憑據，
            或設定 webhook URL，將「合約簽完」「milestone 逾期」等事件即時推到 Slack / Discord / n8n / Make。
          </p>
        </section>

        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 760 }}>
          <BillingBanner />
        </section>

        {p && (
          <section className="container" style={{ padding: "0 32px 16px", maxWidth: 760 }}>
            <div className="card" style={{
              padding: 18, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              <div className="row gap-2"><Icon name="hash" size={13} /><b style={{ fontSize: 14 }}>身分</b></div>
              <div style={{ fontSize: 12.5, color: "var(--ink-muted)", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
                uid: {p.uid}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                方案：{p.plan === "PRO" ? "PRO" : "FREE"}
                {p.periodEnd && p.plan === "PRO" && <> · 至 {new Date(p.periodEnd).toLocaleDateString("zh-Hant")}</>}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.6 }}>
                ※ uid 存在你的瀏覽器 cookie。換瀏覽器 / 清 cookie 會視為新使用者。
                想跨裝置帶 Pro，請填下方 Email + 跟客服回報轉移。
              </div>
            </div>
          </section>
        )}

        <section className="container" style={{ padding: "0 32px 16px", maxWidth: 760 }}>
          <div className="card" style={{
            padding: 18, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <div className="row gap-2"><Icon name="mail" size={13} /><b style={{ fontSize: 14 }}>Email</b></div>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
              用於付款收據、Pro 啟用憑據、跨裝置轉移時的身分確認。
            </div>
          </div>
        </section>

        <section className="container" style={{ padding: "0 32px 24px", maxWidth: 760 }}>
          <div className="card" style={{
            padding: 18, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <div className="row gap-2"><Icon name="zap" size={13} /><b style={{ fontSize: 14 }}>Webhook 通知</b></div>
            <div style={{ fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.6 }}>
              支援所有接受 POST JSON 的 endpoint：Slack incoming webhook、Discord、Make.com、Zapier、n8n、自家 server。
              觸發事件：<code>contract.signed.full</code>、<code>milestone.overdue</code>、<code>milestone.due</code>。
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>Webhook URL</label>
              <input
                className="input"
                style={{ marginTop: 4 }}
                placeholder="https://hooks.slack.com/services/T0/B0/xxxx"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>Secret（選填，會加上 X-DocGen-Signature: sha256=… 標頭）</label>
              <div className="row gap-2" style={{ marginTop: 4 }}>
                <input className="input" placeholder="（可空白；填了會用 HMAC-SHA256 簽名 body）" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={randomiseSecret}>產一組</button>
              </div>
            </div>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              <button className="btn btn-primary" disabled={busy} onClick={() => save(false)}>
                {busy ? "儲存中…" : "儲存設定"}
              </button>
              <button className="btn btn-soft" disabled={busy || !webhookUrl} onClick={() => save(true)}>
                <Icon name="send" size={12} />儲存並發測試
              </button>
            </div>
            {testResult && (
              <div style={{
                fontSize: 12.5, padding: "8px 12px", borderRadius: 6,
                background: testResult.ok ? "#e8f5ed" : "#fde9e9",
                color: testResult.ok ? "#1f5a35" : "#7a1f1f",
              }}>
                {testResult.ok
                  ? `✓ 測試 webhook 成功（HTTP ${testResult.status}）`
                  : `✗ 測試失敗：${testResult.reason}${testResult.status ? ` (HTTP ${testResult.status})` : ""}`}
              </div>
            )}
            {err && <div className="field-error"><Icon name="alert" size={12} />{err}</div>}
          </div>
        </section>

        <section className="container" style={{ padding: "0 32px 64px", maxWidth: 760 }}>
          <details className="card" style={{ padding: 16, background: "var(--bg-soft)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Payload 範例</summary>
            <pre style={{
              marginTop: 10, fontSize: 12, fontFamily: "var(--font-mono)",
              padding: 12, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 6,
              overflow: "auto", whiteSpace: "pre",
            }}>{`POST <your-webhook-url>
Content-Type: application/json
X-DocGen-Signature: sha256=<hex>   (only if secret set)

{
  "event": "contract.signed.full",
  "summary": "📑 合約已雙方簽署：某公司 ↔ 王小明 (freelance)",
  "text": "...",                    // Slack-compatible fallback
  "data": {
    "type": "contract.signed.full",
    "contractId": "abc123",
    "templateId": "freelance",
    "senderName": "某公司",
    "recipientName": "王小明"
  },
  "timestamp": "2026-05-11T12:00:00.000Z",
  "source": "docgen-tw"
}`}</pre>
          </details>
        </section>

        <Footer />
      </main>
    </>
  );
}
