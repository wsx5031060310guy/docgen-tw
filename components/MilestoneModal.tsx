"use client";
import { useState } from "react";
import { Icon } from "./Icon";

const KINDS = [
  { value: "PAYMENT", label: "付款", hint: "客戶應給付款項" },
  { value: "DELIVERY", label: "交付", hint: "我方應交付成果" },
  { value: "RENEWAL", label: "續約", hint: "合約到期續約日" },
  { value: "CUSTOM", label: "其他", hint: "自訂事項" },
];

export function MilestoneModal({
  contractId,
  onClose,
  onDone,
  defaultKind = "PAYMENT",
}: {
  contractId: string;
  onClose: () => void;
  onDone: () => void;
  defaultKind?: string;
}) {
  const [kind, setKind] = useState(defaultKind);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    if (!title.trim()) return setErr("請輸入項目名稱");
    if (!dueDate) return setErr("請選擇到期日");
    setBusy(true);
    try {
      const r = await fetch("/api/milestones", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contractId,
          kind,
          title: title.trim(),
          dueDate,
          amount: kind === "PAYMENT" && amount ? Number(amount) : undefined,
          note: note || undefined,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{
        maxWidth: 480, width: "100%", padding: 22, background: "var(--bg)",
        border: "1px solid var(--line)", borderRadius: "var(--radius)",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div className="row gap-2"><Icon name="plus" size={14} /><b style={{ fontSize: 16 }}>新增追蹤項目</b></div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={13} /></button>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>類型</label>
          <div className="row gap-2" style={{ marginTop: 6, flexWrap: "wrap" }}>
            {KINDS.map((k) => (
              <button
                key={k.value}
                onClick={() => setKind(k.value)}
                className={`btn btn-sm ${kind === k.value ? "btn-primary" : "btn-soft"}`}
                type="button"
              >{k.label}</button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-muted)", marginTop: 4 }}>
            {KINDS.find((k) => k.value === kind)?.hint}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>項目名稱</label>
          <input className="input" style={{ marginTop: 4 }} placeholder="例：頭期款 30%"
            value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="dg-fields-2col" style={{ gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>到期日</label>
            <input className="input" style={{ marginTop: 4 }} type="date"
              value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          {kind === "PAYMENT" && (
            <div>
              <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>金額（NT$，可空白）</label>
              <input className="input" style={{ marginTop: 4 }} type="number" placeholder="36000"
                value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>備註（可空白）</label>
          <textarea className="input" rows={2} style={{ marginTop: 4, resize: "vertical" }}
            value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {err && <div className="field-error"><Icon name="alert" size={12} />{err}</div>}

        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-soft" onClick={onClose} disabled={busy}>取消</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? "建立中…" : "建立"}
          </button>
        </div>
      </div>
    </div>
  );
}
