"use client";
import { useId, useRef, useState } from "react";
import { Icon } from "./Icon";
import { ModalShell } from "./ModalShell";

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
  const [invalidField, setInvalidField] = useState<"title" | "dueDate" | null>(null);
  const kindHintId = useId();
  const titleId = useId();
  const dueDateId = useId();
  const amountId = useId();
  const noteId = useId();
  const errorId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);

  async function submit() {
    setErr(null);
    setInvalidField(null);
    if (!title.trim()) {
      setErr("請輸入項目名稱");
      setInvalidField("title");
      titleRef.current?.focus();
      return;
    }
    if (!dueDate) {
      setErr("請選擇到期日");
      setInvalidField("dueDate");
      dueDateRef.current?.focus();
      return;
    }
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
    <ModalShell
      title="新增追蹤項目"
      icon={<Icon name="plus" size={16} />}
      onClose={onClose}
      busy={busy}
      closeLabel="關閉新增追蹤項目對話框"
      actions={
        <div className="dg-dialog-actions__primary">
          <button className="btn btn-soft" type="button" onClick={onClose} disabled={busy}>取消</button>
          <button className="btn btn-primary" type="button" onClick={submit} disabled={busy} aria-busy={busy || undefined}>
            {busy ? "建立中…" : "建立"}
          </button>
        </div>
      }
    >
      <fieldset className="field dg-modal-section" disabled={busy} aria-describedby={kindHintId}>
        <legend className="field-label">類型</legend>
        <div className="dg-modal-kind-list">
          {KINDS.map((k) => (
            <button
              key={k.value}
              onClick={() => setKind(k.value)}
              className={`btn btn-sm ${kind === k.value ? "btn-primary" : "btn-soft"}`}
              type="button"
              aria-pressed={kind === k.value}
            >{k.label}</button>
          ))}
        </div>
        <p id={kindHintId} className="field-help">{KINDS.find((k) => k.value === kind)?.hint}</p>
      </fieldset>

      <div className="field">
        <label className="field-label" htmlFor={titleId}>項目名稱</label>
        <input
          ref={titleRef}
          id={titleId}
          className="input"
          placeholder="例：頭期款 30%"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={invalidField === "title" || undefined}
          aria-describedby={invalidField === "title" ? errorId : undefined}
          disabled={busy}
        />
      </div>

      <div className="dg-form-grid">
        <div className="field">
          <label className="field-label" htmlFor={dueDateId}>到期日</label>
          <input
            ref={dueDateRef}
            id={dueDateId}
            className="input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-invalid={invalidField === "dueDate" || undefined}
            aria-describedby={invalidField === "dueDate" ? errorId : undefined}
            disabled={busy}
          />
        </div>
        {kind === "PAYMENT" && (
          <div className="field">
            <label className="field-label" htmlFor={amountId}>金額（NT$，可空白）</label>
            <input
              id={amountId}
              className="input"
              type="number"
              placeholder="36000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={busy}
            />
          </div>
        )}
      </div>

      <div className="field">
        <label className="field-label" htmlFor={noteId}>備註（可空白）</label>
        <textarea
          id={noteId}
          className="textarea"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy}
        />
      </div>

      {err && (
        <div id={errorId} className="field-error" role="alert">
          <Icon name="alert" size={12} />{err}
        </div>
      )}
    </ModalShell>
  );
}
