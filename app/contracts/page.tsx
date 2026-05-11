"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { TEMPLATES, getTemplate } from "@/lib/templates";

type Row = {
  id: string;
  templateId: string | null;
  client: string;
  recipientName: string | null;
  recipientEmail: string | null;
  signingStatus: string;
  expiryDate: string | null;
  createdAt: string;
  case: { id: string; title: string } | null;
  milestones: { id: string; status: string }[];
};

const STATUSES = [
  { value: "", label: "全部" },
  { value: "AWAITING_RECIPIENT", label: "待乙方簽" },
  { value: "FULLY_SIGNED", label: "已雙簽" },
  { value: "SENDER_SIGNED", label: "僅甲方簽" },
  { value: "UNSIGNED", label: "未簽" },
];

export default function ContractsListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [template, setTemplate] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      if (status) sp.set("status", status);
      if (template) sp.set("template", template);
      if (q.trim()) sp.set("q", q.trim());
      const r = await fetch(`/api/contracts?${sp.toString()}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setRows(j.contracts ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [status, template, q]);

  const stats = useMemo(() => {
    const overdue = rows.reduce(
      (s, r) => s + r.milestones.filter((m) => m.status === "OVERDUE").length,
      0,
    );
    const awaiting = rows.filter((r) => r.signingStatus === "AWAITING_RECIPIENT").length;
    return { total: rows.length, overdue, awaiting };
  }, [rows]);

  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "32px 32px 16px", maxWidth: 1200 }}>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            <Icon name="fileText" size={13} /> 合約列表
          </div>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <h1 style={{ fontSize: 40 }}>所有合約</h1>
            <Link href="/contracts/new" className="btn btn-primary">
              <Icon name="plus" size={13} />新增合約
            </Link>
          </div>
          <div className="row gap-4" style={{ marginTop: 12, fontSize: 13, color: "var(--ink-muted)" }}>
            <span>共 {stats.total} 筆</span>
            <span style={{ color: stats.awaiting ? "#7a5a2a" : undefined }}>待簽 {stats.awaiting}</span>
            <span style={{ color: stats.overdue ? "#7a1f1f" : undefined }}>包含逾期 {stats.overdue} 項</span>
          </div>
        </section>

        <section className="container" style={{ padding: "8px 32px 16px", maxWidth: 1200 }}>
          <div className="card" style={{
            padding: 14, background: "var(--bg-elev)", border: "1px solid var(--line)",
            borderRadius: "var(--radius)", display: "flex", gap: 10, flexWrap: "wrap",
            alignItems: "center",
          }}>
            <input className="input" placeholder="搜尋甲方/乙方/Email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 220 }} />
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select className="input" value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="">所有模板</option>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {(q || status || template) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setQ(""); setStatus(""); setTemplate(""); }}>
                <Icon name="x" size={11} />清除
              </button>
            )}
          </div>
        </section>

        <section className="container" style={{ padding: "8px 32px 64px", maxWidth: 1200 }}>
          {loading && <div style={{ color: "var(--ink-muted)" }}>載入中…</div>}
          {error && (
            <div className="card" style={{ padding: 16, background: "#fde9e9", border: "1px solid #f1b5b5", color: "#7a1f1f" }}>
              讀取失敗：{error}
            </div>
          )}
          {!loading && !error && rows.length === 0 && (
            <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--ink-muted)" }}>
              無符合條件的合約。
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((r) => {
              const tpl = r.templateId ? getTemplate(r.templateId) : null;
              const overdue = r.milestones.filter((m) => m.status === "OVERDUE").length;
              return (
                <Link key={r.id} href={`/contracts/${r.id}`} className="card"
                  style={{
                    padding: "14px 16px", textDecoration: "none", color: "inherit",
                    background: "var(--bg-elev)", border: "1px solid var(--line)",
                    borderRadius: "var(--radius)", display: "flex",
                    justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                    <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                      <Icon name={tpl?.icon || "fileText"} size={13} />
                      <b style={{ fontSize: 15 }}>{tpl?.name || r.templateId || "—"}</b>
                      <span className="chip chip-zinc" style={{ fontSize: 11 }}>{r.signingStatus}</span>
                      {r.case && (
                        <span className="chip chip-zinc" style={{ fontSize: 11 }}>
                          <Icon name="folder" size={10} />{r.case.title}
                        </span>
                      )}
                      {overdue > 0 && (
                        <span style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 999,
                          background: "#fde9e9", color: "#7a1f1f", border: "1px solid #f1b5b5",
                        }}>
                          逾期 {overdue}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                      {r.client || "—"} → {r.recipientName || "—"}
                      {r.recipientEmail && <span style={{ marginLeft: 4 }}>·{r.recipientEmail}</span>}
                      <span style={{ marginLeft: 6 }}>· {new Date(r.createdAt).toLocaleDateString("zh-Hant")}</span>
                    </div>
                  </div>
                  <Icon name="chevronRight" size={14} style={{ color: "var(--ink-muted)" }} />
                </Link>
              );
            })}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
