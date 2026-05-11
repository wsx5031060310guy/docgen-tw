"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/cases");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setCases(j.cases ?? []);
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  useEffect(() => { load(); }, []);

  async function attach(caseId: string | null) {
    setBusy(true);
    setErr(null);
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
        display: "flex", flexDirection: "column", gap: 14, maxHeight: "80vh", overflowY: "auto",
      }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div className="row gap-2"><Icon name="folder" size={14} /><b style={{ fontSize: 16 }}>指派到案件</b></div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={13} /></button>
        </div>

        {cases.length > 0 && (
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>選擇現有案件</label>
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
              {cases.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className="card"
                  style={{
                    padding: "10px 14px", textAlign: "left", cursor: "pointer",
                    border: `1px solid ${selected === c.id ? "var(--primary)" : "var(--line)"}`,
                    background: selected === c.id ? "var(--bg-soft)" : "var(--bg-elev)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <div className="row gap-2" style={{ justifyContent: "space-between" }}>
                    <span>{c.title}</span>
                    <span className="chip chip-zinc" style={{ fontSize: 11 }}>{c.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>或建立新案件</label>
          <div className="row gap-2" style={{ marginTop: 6 }}>
            <input className="input" placeholder="案件名稱" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <button className="btn btn-soft btn-sm" onClick={createAndAttach} disabled={busy || !newTitle.trim()}>
              建立並指派
            </button>
          </div>
        </div>

        {err && <div className="field-error"><Icon name="alert" size={12} />{err}</div>}

        <div className="row" style={{ justifyContent: "space-between", gap: 8, marginTop: 4 }}>
          {currentCaseId && (
            <button className="btn btn-ghost btn-sm" onClick={() => attach(null)} disabled={busy}>
              <Icon name="x" size={11} />取消指派
            </button>
          )}
          <div className="row gap-2" style={{ marginLeft: "auto" }}>
            <button className="btn btn-soft" onClick={onClose} disabled={busy}>取消</button>
            <button
              className="btn btn-primary"
              onClick={() => selected && attach(selected)}
              disabled={busy || !selected || selected === currentCaseId}
            >
              {busy ? "處理中…" : "確認指派"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
