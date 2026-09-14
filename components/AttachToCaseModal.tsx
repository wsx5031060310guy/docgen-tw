"use client";
import { useEffect, useId, useState } from "react";
import { Icon } from "./Icon";
import { ModalShell } from "./ModalShell";

type CaseRow = { id: string; title: string; status: string };

export function AttachToCaseModal({
  contractId,
  currentCaseId,
  onClose,
  onDone,
}: {
  contractId: string;
  currentCaseId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [selected, setSelected] = useState<string | null>(currentCaseId);
  const [newTitle, setNewTitle] = useState("");
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<"newTitle" | null>(null);
  const newTitleId = useId();
  const actionErrorId = useId();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cases")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (!cancelled) setCases(j.cases ?? []);
      })
      .catch((e) => {
        if (!cancelled) setLoadError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoadingCases(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadKey]);

  function retryLoad() {
    setLoadingCases(true);
    setLoadError(null);
    setLoadKey((key) => key + 1);
  }

  async function attach(caseId: string | null) {
    setBusy(true);
    setErr(null);
    setErrorField(null);
    try {
      const r = await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId }),
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

  async function createAndAttach() {
    if (!newTitle.trim()) return;
    setBusy(true);
    setErr(null);
    setErrorField(null);
    try {
      const r = await fetch("/api/cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      await attach(j.case.id);
    } catch (e) {
      setErr((e as Error).message);
      setErrorField("newTitle");
      setBusy(false);
    }
  }

  return (
    <ModalShell
      title="指派到案件"
      icon={<Icon name="folder" size={16} />}
      onClose={onClose}
      busy={busy}
      closeLabel="關閉指派到案件對話框"
      actions={
        <>
          {currentCaseId && (
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => attach(null)} disabled={busy}>
              <Icon name="x" size={11} />取消指派
            </button>
          )}
          <div className="dg-dialog-actions__primary">
            <button className="btn btn-soft" type="button" onClick={onClose} disabled={busy}>取消</button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => selected && attach(selected)}
              disabled={busy || !selected || selected === currentCaseId}
              aria-busy={busy || undefined}
            >
              {busy ? "處理中…" : "確認指派"}
            </button>
          </div>
        </>
      }
    >
      <fieldset className="dg-modal-section">
        <legend className="field-label">選擇現有案件</legend>
        {loadingCases ? (
          <div className="dg-notice dg-notice--info dg-modal-list-state" role="status" aria-live="polite" aria-busy="true">
            <Icon name="loader" size={14} className="spin" />
            <span>載入案件中…</span>
          </div>
        ) : loadError ? (
          <div className="dg-notice dg-notice--error dg-modal-list-state" role="alert">
            <span>無法載入案件：{loadError}</span>
            <button className="btn btn-ghost btn-sm" type="button" onClick={retryLoad}>重新載入</button>
          </div>
        ) : cases.length === 0 ? (
          <div className="dg-notice dg-notice--info dg-modal-list-state" role="status">
            尚無案件，可在下方建立新案件。
          </div>
        ) : (
          <div className="dg-modal-option-list">
            {cases.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className={`card dg-modal-option${selected === c.id ? " dg-card-selected" : ""}`}
                aria-pressed={selected === c.id}
                disabled={busy}
              >
                <span className="dg-modal-option__title">{c.title}</span>
                <span className="chip chip-zinc dg-modal-option__status">{c.status}</span>
              </button>
            ))}
          </div>
        )}
      </fieldset>

      <div className="field dg-modal-new-case">
        <label className="field-label" htmlFor={newTitleId}>或建立新案件</label>
        <div className="dg-modal-inline-field">
          <input
            id={newTitleId}
            className="input"
            placeholder="案件名稱"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            aria-invalid={errorField === "newTitle" || undefined}
            aria-describedby={errorField === "newTitle" ? actionErrorId : undefined}
            disabled={busy}
          />
          <button className="btn btn-soft btn-sm" type="button" onClick={createAndAttach} disabled={busy || !newTitle.trim()}>
            建立並指派
          </button>
        </div>
      </div>

      {err && (
        <div id={actionErrorId} className="field-error" role="alert">
          <Icon name="alert" size={12} />{err}
        </div>
      )}
    </ModalShell>
  );
}
