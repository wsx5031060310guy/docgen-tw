"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";

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

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newCounterparty, setNewCounterparty] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
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
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!newTitle.trim()) return;
    setCreating(true);
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
      alert((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "32px 32px 24px", maxWidth: 1100 }}>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            <Icon name="folder" size={13} />
            案件資料夾
          </div>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <h1 style={{ fontSize: 40 }}>所有案件</h1>
            <Link href="/contracts/new" className="btn btn-soft">
              <Icon name="plus" size={13} />新增合約
            </Link>
          </div>
        </section>

        <section className="container" style={{ padding: "0 32px 24px", maxWidth: 1100 }}>
          <div
            className="card"
            style={{
              padding: 18, background: "var(--bg-elev)", border: "1px solid var(--line)",
              borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: 12,
            }}
          >
            <div className="row gap-2"><Icon name="plus" size={14} /><b style={{ fontSize: 14 }}>建立新案件</b></div>
            <div className="dg-fields-2col" style={{ gap: 12 }}>
              <input className="input" placeholder="案件名稱（例：王設計 / 品牌專案）" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <input className="input" placeholder="客戶（甲方）" value={newClient} onChange={(e) => setNewClient(e.target.value)} />
              <input className="input" placeholder="相對人（乙方）" value={newCounterparty} onChange={(e) => setNewCounterparty(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={create} disabled={creating || !newTitle.trim()} style={{ alignSelf: "flex-start" }}>
              {creating ? "建立中…" : "建立案件"}
            </button>
          </div>
        </section>

        <section className="container" style={{ padding: "12px 32px 64px", maxWidth: 1100 }}>
          {loading && <div style={{ color: "var(--ink-muted)" }}>載入中…</div>}
          {error && (
            <div className="card" style={{ padding: 16, background: "#fde9e9", border: "1px solid #f1b5b5", color: "#7a1f1f" }}>
              無法載入案件：{error}
              <br />
              <span style={{ fontSize: 12, opacity: 0.85 }}>（若為 Vercel 預覽環境，請確認 DATABASE_POSTGRES_PRISMA_URL 已設定，且 schema 已 push）</span>
            </div>
          )}
          {!loading && !error && cases.length === 0 && (
            <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--ink-muted)" }}>
              <Icon name="folder" size={24} />
              <div style={{ marginTop: 8 }}>目前還沒有案件。在上方建立第一個案件。</div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="card"
                style={{
                  padding: 18, border: "1px solid var(--line)", borderRadius: "var(--radius)",
                  background: "var(--bg-elev)", textDecoration: "none", color: "inherit",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div className="row gap-2"><b style={{ fontSize: 16 }}>{c.title}</b>
                    <span className="chip chip-zinc" style={{ fontSize: 11 }}>{c.status}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                    {c.clientName || "—"} ↔ {c.counterparty || "—"} ·
                    更新 {new Date(c.updatedAt).toLocaleDateString("zh-Hant")}
                  </div>
                </div>
                <div className="row gap-3" style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                  <span><Icon name="fileText" size={12} /> {c.contracts.length} 合約</span>
                  <span><Icon name="paperclip" size={12} /> {c.attachments.length} 附件</span>
                  <Icon name="chevronRight" size={14} />
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
