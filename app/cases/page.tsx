"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { UIState } from "@/components/UIState";

type CaseRow = {
  id: string;
  title: string;
  clientName?: string | null;
  counterparty?: string | null;
  status: string;
  contracts: { id: string; signingStatus: string; expiryDate?: string | null }[];
  attachments: { id: string }[];
  updatedAt: string;
};

const CASE_STATUS_LABEL: Record<string, string> = {
  OPEN: "進行中",
  CLOSED: "已結案",
  ARCHIVED: "已封存",
};

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newCounterparty, setNewCounterparty] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/cases");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setCases(data.cases ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function create() {
    if (!newTitle.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const r = await fetch("/api/cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          clientName: newClient || undefined,
          counterparty: newCounterparty || undefined,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      setNewTitle("");
      setNewClient("");
      setNewCounterparty("");
      await load();
    } catch (e) {
      setCreateError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-cases-page">
        <header className="dg-page-shell dg-cases-header">
          <div className="dg-eyebrow dg-cases-eyebrow">
            <Icon name="folder" size={13} />
            案件資料夾
          </div>
          <div className="dg-page-header dg-cases-heading-row">
            <div className="dg-stack dg-cases-heading-copy">
              <h1 className="dg-page-title">所有案件</h1>
              <p className="dg-text-secondary">依案件整理合約、追蹤項目與附件。</p>
            </div>
            <Link href="/contracts/new" className="btn btn-soft">
              <Icon name="plus" size={13} />新增合約
            </Link>
          </div>
        </header>

        <section className="dg-page-shell dg-cases-create-section" aria-labelledby="create-case-title">
          <div className="card dg-card-body dg-cases-create-card">
            <h2 id="create-case-title" className="dg-section-title dg-cases-create-title"><Icon name="plus" size={16} />建立新案件</h2>
            <div className="dg-form-grid dg-cases-create-grid">
              <div className="field dg-field-span-2">
                <label className="field-label" htmlFor="new-case-title">案件名稱</label>
                <input id="new-case-title" className="input" placeholder="例：王設計 / 品牌專案" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} aria-describedby={createError ? "create-case-error" : undefined} aria-invalid={Boolean(createError) || undefined} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="new-case-client">客戶（甲方）</label>
                <input id="new-case-client" className="input" placeholder="輸入客戶名稱" value={newClient} onChange={(e) => setNewClient(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="new-case-counterparty">相對人（乙方）</label>
                <input id="new-case-counterparty" className="input" placeholder="輸入相對人名稱" value={newCounterparty} onChange={(e) => setNewCounterparty(e.target.value)} />
              </div>
            </div>
            {createError && <div id="create-case-error" className="dg-notice dg-notice--error" role="alert">建立失敗：{createError}</div>}
            <button className="btn btn-primary dg-cases-create-submit" onClick={create} disabled={creating || !newTitle.trim()} aria-busy={creating || undefined}>
              {creating ? "建立中…" : "建立案件"}
            </button>
          </div>
        </section>

        <section className="dg-page-shell dg-cases-list-section" aria-busy={loading}>
          {loading && cases.length === 0 && <UIState status="loading" title="案件載入中" description="正在取得案件資料。" />}
          {error && cases.length === 0 && (
            <UIState status="error" title="無法載入案件" description={`讀取失敗：${error}`} actions={<button className="btn btn-primary" onClick={load}>重新載入</button>} />
          )}
          {error && cases.length > 0 && (
            <div className="dg-notice dg-notice--error dg-contract-detail-notice" role="alert">
              <span>更新案件清單失敗：{error}。目前顯示上次取得的資料。</span>
              <button className="btn btn-ghost btn-sm" onClick={load}>重新讀取</button>
            </div>
          )}
          {!loading && !error && cases.length === 0 && (
            <UIState status="empty" title="目前還沒有案件" description="在上方建立第一個案件，開始整理合約與附件。" />
          )}
          {cases.length > 0 && <div className="dg-cases-list-heading">
            <h2 className="dg-section-title">案件清單</h2>
            <span className="chip chip-zinc">{cases.length} 件</span>
          </div>}
          <div className="dg-cases-list">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="card card-hover dg-list-item dg-case-list-item"
              >
                <div className="dg-case-list-item__content">
                  <div className="dg-case-list-item__heading">
                    <h3 className="dg-subsection-title dg-case-list-item__title">{c.title}</h3>
                    <span className="chip chip-zinc">{CASE_STATUS_LABEL[c.status] || c.status}</span>
                  </div>
                  <div className="dg-case-list-item__metadata">
                    <span>{c.clientName || "—"} ↔ {c.counterparty || "—"}</span>
                    <span>更新 <time dateTime={c.updatedAt}>{new Date(c.updatedAt).toLocaleDateString("zh-Hant")}</time></span>
                  </div>
                </div>
                <div className="dg-case-list-item__counts">
                  <span><Icon name="fileText" size={12} /> {c.contracts.length} 合約</span>
                  <span><Icon name="paperclip" size={12} /> {c.attachments.length} 附件</span>
                  <Icon name="chevronRight" size={14} className="dg-case-list-item__chevron" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
