"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BillingBanner } from "@/components/BillingBanner";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import {
  SettingsApiKeys,
  type SettingsApiKey,
  type SettingsLoadState,
} from "@/components/SettingsApiKeys";
import {
  SettingsProfileFields,
  type SettingsProfile,
} from "@/components/SettingsProfileFields";
import { TopNav } from "@/components/TopNav";
import { UIState } from "@/components/UIState";

const MAGIC_MESSAGE: Record<string, { kind: "success" | "error" | "warning"; text: string }> = {
  ok: { kind: "success", text: "✓ Email 已綁定，跨裝置登入成功。本瀏覽器 cookie 已綁到該 Email 的同一帳號。" },
  missing: { kind: "error", text: "✗ 連結缺少 token。" },
  invalid: { kind: "error", text: "✗ 連結無效或已被使用。請重新申請。" },
  used: { kind: "error", text: "✗ 此連結已被使用。每個連結僅可使用一次。" },
  expired: { kind: "error", text: "✗ 連結已過期（15 分鐘有效）。請重新申請。" },
  disabled: { kind: "warning", text: "⚠ 此部署未啟用資料庫，無法綁定 Email。" },
};

const WEBHOOK_PAYLOAD_EXAMPLE = `POST <your-webhook-url>
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
}`;

type ProfileLoadState = "loading" | "ready" | "empty" | "error";

function SettingsInner() {
  const params = useSearchParams();
  const magic = params.get("magic");
  const magicMsg = magic ? MAGIC_MESSAGE[magic] : null;

  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [profileLoadState, setProfileLoadState] = useState<ProfileLoadState>("loading");
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; status?: number; reason?: string } | null>(null);

  const [email, setEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  const [apiKeys, setApiKeys] = useState<SettingsApiKey[]>([]);
  const [keysLoadState, setKeysLoadState] = useState<SettingsLoadState>("loading");
  const [keysLoadError, setKeysLoadError] = useState<string | null>(null);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [issued, setIssued] = useState<{ rawKey: string; prefix: string } | null>(null);
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyActionError, setKeyActionError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"success" | "error" | null>(null);

  const [magicEmail, setMagicEmail] = useState("");
  const [magicBusy, setMagicBusy] = useState(false);
  const [magicSent, setMagicSent] = useState<string | null>(null);
  const [magicError, setMagicError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/billing/profile");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const nextProfile = (await response.json()) as SettingsProfile | null;
      if (!nextProfile) {
        setProfile(null);
        setProfileLoadState("empty");
        return;
      }
      setProfile(nextProfile);
      setEmail(nextProfile.email ?? "");
      setWebhookUrl(nextProfile.webhookUrl ?? "");
      setWebhookSecret(nextProfile.webhookSecret ?? "");
      setProfileLoadState("ready");
    } catch (error) {
      setProfileLoadError((error as Error).message);
      setProfileLoadState("error");
    }
  }, []);

  const fetchKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/billing/api-keys");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { keys?: SettingsApiKey[] };
      const nextKeys = data.keys ?? [];
      setApiKeys(nextKeys);
      setKeysLoadState(nextKeys.length === 0 ? "empty" : "ready");
    } catch (error) {
      setKeysLoadError((error as Error).message);
      setKeysLoadState("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/billing/profile")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<SettingsProfile | null>;
      })
      .then((nextProfile) => {
        if (cancelled) return;
        if (!nextProfile) {
          setProfile(null);
          setProfileLoadState("empty");
          return;
        }
        setProfile(nextProfile);
        setEmail(nextProfile.email ?? "");
        setWebhookUrl(nextProfile.webhookUrl ?? "");
        setWebhookSecret(nextProfile.webhookSecret ?? "");
        setProfileLoadState("ready");
      })
      .catch((error) => {
        if (!cancelled) {
          setProfileLoadError((error as Error).message);
          setProfileLoadState("error");
        }
      });

    fetch("/api/billing/api-keys")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{ keys?: SettingsApiKey[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        const nextKeys = data.keys ?? [];
        setApiKeys(nextKeys);
        setKeysLoadState(nextKeys.length === 0 ? "empty" : "ready");
      })
      .catch((error) => {
        if (!cancelled) {
          setKeysLoadError((error as Error).message);
          setKeysLoadState("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function retryProfile() {
    setProfileLoadState("loading");
    setProfileLoadError(null);
    void fetchProfile();
  }

  function retryKeys() {
    setKeysLoadState("loading");
    setKeysLoadError(null);
    void fetchKeys();
  }

  async function issueKey() {
    setKeyBusy(true);
    setKeyActionError(null);
    setCopyStatus(null);
    try {
      const response = await fetch("/api/billing/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: newKeyLabel || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      setIssued({ rawKey: data.key.rawKey, prefix: data.key.prefix });
      setNewKeyLabel("");
      setKeysLoadState("loading");
      await fetchKeys();
    } catch (error) {
      setKeyActionError(`產生 API key 失敗：${(error as Error).message}`);
    } finally {
      setKeyBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!window.confirm("確認撤銷此 API key？此操作不可復原。")) return;
    setKeyBusy(true);
    setKeyActionError(null);
    try {
      const response = await fetch(`/api/billing/api-keys?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || `HTTP ${response.status}`);
      }
      setKeysLoadState("loading");
      await fetchKeys();
    } catch (error) {
      setKeyActionError(`撤銷 API key 失敗：${(error as Error).message}`);
    } finally {
      setKeyBusy(false);
    }
  }

  async function copyIssuedKey() {
    if (!issued) return;
    setCopyStatus(null);
    try {
      await navigator.clipboard.writeText(issued.rawKey);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  }

  async function sendMagic() {
    setMagicSent(null);
    setMagicError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(magicEmail)) {
      setMagicError("Email 格式不正確");
      return;
    }
    setMagicBusy(true);
    try {
      const response = await fetch("/api/auth/email/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: magicEmail.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      setMagicSent(`已寄出登入連結至 ${magicEmail}，請查收信箱（15 分鐘內有效）。`);
    } catch (error) {
      setMagicError((error as Error).message);
    } finally {
      setMagicBusy(false);
    }
  }

  async function save(testWebhook = false) {
    setSaveError(null);
    setSaveMessage(null);
    setTestResult(null);
    setBusy(true);
    try {
      const response = await fetch("/api/billing/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, webhookUrl, webhookSecret, testWebhook }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      setProfile(data.profile);
      setSaveMessage("設定已儲存。");
      if (data.testResult) setTestResult(data.testResult);
    } catch (error) {
      setSaveError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function randomiseSecret() {
    const arr = new Uint8Array(24);
    window.crypto.getRandomValues(arr);
    setWebhookSecret(Array.from(arr).map((byte) => byte.toString(16).padStart(2, "0")).join(""));
  }

  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <div className="dg-page-shell dg-page-shell--form dg-settings-page">
          <header className="dg-page-header dg-settings-header">
            <div>
              <div className="dg-eyebrow dg-settings-eyebrow"><Icon name="users" size={13} />設定</div>
              <h1 className="dg-page-title">帳號 &amp; 整合</h1>
              <p className="dg-text-secondary dg-settings-intro">
                本平台以瀏覽器 cookie 識別身分（無註冊登入）。可選擇綁定 Email 收取 Pro 啟用憑據，
                或設定 webhook URL，將「合約簽完」「milestone 逾期」等事件即時推到 Slack、Discord、n8n 或 Make。
              </p>
            </div>
          </header>

          {magicMsg && (
            <div className={`dg-notice dg-notice--${magicMsg.kind}`} role={magicMsg.kind === "error" ? "alert" : "status"}>
              {magicMsg.text}
            </div>
          )}

          <BillingBanner />

          {profileLoadState === "loading" && (
            <UIState status="loading" title="帳號資料載入中" description="正在取得身分、Email 與 webhook 設定。" />
          )}
          {profileLoadState === "error" && (
            <UIState
              status="error"
              title="無法載入帳號資料"
              description={`讀取失敗：${profileLoadError}`}
              actions={<button type="button" className="btn btn-primary" onClick={retryProfile}>重新載入</button>}
            />
          )}
          {profileLoadState === "empty" && (
            <UIState status="empty" title="找不到帳號資料" description="伺服器未回傳可用的身分資料，請稍後重新載入。" actions={<button type="button" className="btn btn-primary" onClick={retryProfile}>重新載入</button>} />
          )}
          {profileLoadState === "ready" && profile && (
            <SettingsProfileFields
              profile={profile}
              email={email}
              webhookUrl={webhookUrl}
              webhookSecret={webhookSecret}
              busy={busy}
              saveMessage={saveMessage}
              saveError={saveError}
              testResult={testResult}
              magicEmail={magicEmail}
              magicBusy={magicBusy}
              magicSent={magicSent}
              magicError={magicError}
              onEmailChange={setEmail}
              onWebhookUrlChange={setWebhookUrl}
              onWebhookSecretChange={setWebhookSecret}
              onRandomiseSecret={randomiseSecret}
              onSave={save}
              onMagicEmailChange={setMagicEmail}
              onSendMagic={sendMagic}
            />
          )}

          <SettingsApiKeys
            keys={apiKeys}
            loadState={keysLoadState}
            loadError={keysLoadError}
            newKeyLabel={newKeyLabel}
            issued={issued}
            busy={keyBusy}
            actionError={keyActionError}
            copyStatus={copyStatus}
            onLabelChange={setNewKeyLabel}
            onIssue={issueKey}
            onRevoke={revoke}
            onCopy={copyIssuedKey}
            onRetry={retryKeys}
          />

          <section className="card dg-card-body dg-settings-card" aria-labelledby="settings-payload-title">
            <h2 id="settings-payload-title" className="dg-section-title">Webhook payload 範例</h2>
            <details className="dg-settings-details">
              <summary>查看 JSON payload 與簽章標頭</summary>
              <pre className="dg-code-block" tabIndex={0} aria-label="Webhook payload 範例"><code>{WEBHOOK_PAYLOAD_EXAMPLE}</code></pre>
            </details>
          </section>
        </div>
        <Footer />
      </main>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="dg-page-shell dg-page-shell--form dg-settings-fallback"><UIState status="loading" title="設定載入中" description="正在準備帳號與整合設定。" /></div>}>
      <SettingsInner />
    </Suspense>
  );
}
