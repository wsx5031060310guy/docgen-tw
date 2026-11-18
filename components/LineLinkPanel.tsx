"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

type LineState = {
  configured: boolean;
  linked: boolean;
  addFriendUrl: string | null;
};

export function LineLinkPanel() {
  const [state, setState] = useState<LineState | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/line/link")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
        return data as LineState;
      })
      .then((data) => {
        if (!cancelled) setState(data);
      })
      .catch((reason) => {
        if (!cancelled) setError(`無法載入 LINE 綁定狀態：${(reason as Error).message}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function call(method: "POST" | "DELETE") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/line/link", { method });
      const data = await response.json() as { code?: string; ok?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error ?? "操作失敗");
      if (method === "POST") setCode(data.code ?? null);
      else {
        setState((current) => current ? { ...current, linked: false } : current);
        setCode(null);
        setConfirmUnlink(false);
      }
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card dg-card-body dg-settings-card dg-ai-line-panel" aria-labelledby="line-link-title">
      <div className="dg-settings-card-heading">
        <Icon name="send" size={18} />
        <h2 id="line-link-title" className="dg-section-title">LINE 合約機器人</h2>
      </div>
      <p className="dg-text-secondary">
        綁定後，在 LINE 傳一句話或語音，機器人會產生合約草稿連結。回到網頁覆核、補齊資料並由甲方簽名後，再轉傳乙方簽署連結。
      </p>
      {!state && !error && <p className="dg-text-secondary" role="status">LINE 綁定狀態載入中…</p>}
      {state && !state.configured && (
        <div className="dg-notice dg-notice--info" role="status">
          LINE 合約機器人尚未開通。管理員完成 LINE Messaging API 設定後即可使用。
        </div>
      )}
      {state?.configured && (
        <>
          {state.linked && <div className="dg-notice dg-notice--success" role="status">已綁定 LINE 帳號</div>}
          {state.addFriendUrl && (
            <a className="btn btn-soft btn-sm" href={state.addFriendUrl} target="_blank" rel="noopener noreferrer">
              加機器人為好友
              <Icon name="externalLink" size={14} />
            </a>
          )}
          {code && (
            <div className="dg-notice dg-notice--info dg-ai-line-code" role="status">
              <span>在 LINE 傳這句給機器人（10 分鐘內有效）：</span>
              <strong>綁定 {code}</strong>
            </div>
          )}
          <div className="dg-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void call("POST")} disabled={busy}>
              {state.linked ? "改綁其他 LINE 帳號" : "產生綁定碼"}
            </button>
            {state.linked && !confirmUnlink && (
              <button type="button" className="btn btn-soft btn-sm" onClick={() => setConfirmUnlink(true)} disabled={busy}>
                解除綁定
              </button>
            )}
          </div>
          {confirmUnlink && (
            <div className="dg-notice dg-notice--warning dg-ai-line-confirm" role="alert">
              <span>解除後，LINE 機器人不能再替你建立合約草稿。確定解除？</span>
              <div className="dg-actions">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => void call("DELETE")} disabled={busy}>
                  確定解除
                </button>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => setConfirmUnlink(false)} disabled={busy}>
                  取消
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {error && <div className="dg-notice dg-notice--error" role="alert">{error}</div>}
    </section>
  );
}
