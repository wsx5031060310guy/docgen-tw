"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import type { AiContractDraft } from "@/lib/ai-contract";

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionCtor = new () => Recognition;

const EXAMPLE = "幫我跟陳設計簽接案合約：品牌識別設計，報酬 12 萬，12/31 交件，簽約付 30%、驗收付 70%";

export function AiContractBox({ onDraft }: { onDraft: (draft: AiContractDraft) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [speechCtor, setSpeechCtor] = useState<RecognitionCtor | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const baseRef = useRef("");

  useEffect(() => {
    const browser = window as unknown as {
      SpeechRecognition?: RecognitionCtor;
      webkitSpeechRecognition?: RecognitionCtor;
    };
    // Browser-only feature detection after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpeechCtor(() => browser.SpeechRecognition ?? browser.webkitSpeechRecognition ?? null);
    return () => recognitionRef.current?.stop();
  }, []);

  function toggleMicrophone() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    if (!speechCtor) return;
    const recognition = new speechCtor();
    recognition.lang = "zh-TW";
    recognition.interimResults = true;
    recognition.continuous = true;
    baseRef.current = text ? `${text.trimEnd()} ` : "";
    recognition.onresult = (event) => {
      let spoken = "";
      for (let i = 0; i < event.results.length; i += 1) spoken += event.results[i][0].transcript;
      setText(baseRef.current + spoken);
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setMessage({ ok: false, text: "麥克風權限被拒絕，請在瀏覽器設定允許麥克風，或直接打字。" });
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setMessage(null);
    setListening(true);
    recognition.start();
  }

  async function submit() {
    recognitionRef.current?.stop();
    if (!text.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/ai/contract-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json() as { draft?: AiContractDraft; error?: string };
      if (!response.ok || !data.draft) {
        setMessage({ ok: false, text: data.error ?? "AI 解析失敗" });
        return;
      }
      if (!data.draft.templateId) {
        setMessage({
          ok: false,
          text: "看不出要哪一種合約，請說清楚類型（例如接案、保密、租賃、借款）。",
        });
        return;
      }
      onDraft(data.draft);
      setMessage({ ok: true, text: "AI 已完成欄位擷取，請逐項覆核。" });
    } catch {
      setMessage({ ok: false, text: "連線失敗，請再試一次" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card dg-card-body dg-ai-contract-box" aria-labelledby="ai-contract-label">
      <div className="dg-ai-contract-heading">
        <Icon name="sparkles" size={18} />
        <div>
          <label id="ai-contract-label" htmlFor="ai-contract-text" className="field-label dg-ai-contract-label">
            AI 一句話產生合約
          </label>
          <p className="field-help">打字或按麥克風說話</p>
        </div>
      </div>
      <textarea
        id="ai-contract-text"
        className="textarea dg-ai-contract-textarea"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void submit();
        }}
        rows={3}
        maxLength={1000}
        placeholder={`例：${EXAMPLE}`}
        aria-describedby="ai-contract-help"
      />
      <p id="ai-contract-help" className="field-help">按 Cmd/Ctrl + Enter 也可送出。</p>
      <div className="dg-actions dg-ai-contract-actions">
        {speechCtor && (
          <button
            type="button"
            className="btn btn-soft btn-sm"
            onClick={toggleMicrophone}
            aria-pressed={listening}
          >
            {listening ? "停止錄音" : "語音輸入"}
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => void submit()}
          disabled={busy || !text.trim()}
          aria-busy={busy || undefined}
        >
          {busy ? "AI 填寫中…" : "AI 自動填寫"}
        </button>
        {!text && (
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setText(EXAMPLE)}>
            填入範例
          </button>
        )}
      </div>
      {message && (
        <div
          className={`dg-notice ${message.ok ? "dg-notice--success" : "dg-notice--error"}`}
          role={message.ok ? "status" : "alert"}
        >
          {message.text}
        </div>
      )}
    </section>
  );
}
