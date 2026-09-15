"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { UIState } from "@/components/UIState";
import { contractTitle, TEMPLATES, getTemplate } from "@/lib/templates";

type Row = {
  id: string;
  templateId: string | null;
  values: Record<string, string>;
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

  const load = useCallback(async () => {
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
  }, [q, status, template]);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const stats = useMemo(() => {
    const overdue = rows.reduce(
      (s, r) => s + r.milestones.filter((m) => m.status === "OVERDUE").length,
      0,
    );
    const awaiting = rows.filter((r) => r.signingStatus === "AWAITING_RECIPIENT").length;
    return { total: rows.length, overdue, awaiting };
  }, [rows]);
  const hasActiveFilters = Boolean(q.trim() || status || template);
  const hasFilterInput = Boolean(q || status || template);

  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-contracts-page">
        <header className="dg-page-shell dg-contracts-header">
          <div className="dg-eyebrow dg-contracts-eyebrow">
            <Icon name="fileText" size={13} /> 合約列表
          </div>
          <div className="dg-page-header dg-contracts-heading-row">
            <div className="dg-stack dg-contracts-heading-copy">
              <h1 className="dg-page-title">所有合約</h1>
              <p className="dg-text-secondary">集中查看簽署進度、案件歸屬與待處理里程碑。</p>
            </div>
            <Link href="/contracts/new" className="btn btn-primary">
              <Icon name="plus" size={13} />新增合約
            </Link>
          </div>
          <div className="dg-contracts-stats" aria-label="合約統計">
            <div className="dg-contracts-stat">
              <span className="dg-contracts-stat__value">{stats.total}</span>
              <span className="dg-contracts-stat__label">目前筆數</span>
            </div>
            <div className="dg-contracts-stat">
              <span className="dg-contracts-stat__value">{stats.awaiting}</span>
              <span className="dg-contracts-stat__label">待乙方簽</span>
            </div>
            <div className="dg-contracts-stat">
              <span className="dg-contracts-stat__value">{stats.overdue}</span>
              <span className="dg-contracts-stat__label">逾期里程碑</span>
            </div>
          </div>
        </header>

        <section className="dg-page-shell dg-contracts-filter-section" aria-label="篩選合約">
          <div className="card dg-card-compact dg-contracts-filter" aria-busy={loading}>
            <input className="input dg-contracts-search" aria-label="搜尋合約（甲方/乙方/Email）" placeholder="搜尋甲方/乙方/Email…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="select dg-contracts-select" aria-label="依狀態篩選" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select className="select dg-contracts-select" aria-label="依模板篩選" value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="">所有模板</option>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {hasFilterInput && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setQ(""); setStatus(""); setTemplate(""); }}>
                <Icon name="x" size={11} />清除
              </button>
            )}
          </div>
        </section>

        <section className="dg-page-shell dg-contracts-list-section" aria-busy={loading}>
          {loading && rows.length === 0 && (
            <UIState status="loading" title="合約載入中" description="正在取得你的合約資料。" />
          )}
          {error && (
            <UIState
              status="error"
              title="無法讀取合約"
              description={`讀取失敗：${error}`}
              actions={<button className="btn btn-primary" onClick={load}>重新載入</button>}
            />
          )}
          {!loading && !error && rows.length === 0 && (
            <UIState
              status="empty"
              title={hasActiveFilters ? "找不到符合條件的合約" : "尚未建立合約"}
              description={hasActiveFilters ? "調整搜尋字詞或篩選條件後再試一次。" : "建立第一份合約後，簽署與案件資訊會顯示在這裡。"}
              actions={hasActiveFilters ? (
                <button className="btn btn-ghost" onClick={() => { setQ(""); setStatus(""); setTemplate(""); }}>清除篩選</button>
              ) : (
                <Link href="/contracts/new" className="btn btn-primary">新增合約</Link>
              )}
            />
          )}
          {rows.length > 0 && (
            <div className="dg-contracts-list-heading">
              <h2 className="dg-section-title">合約清單</h2>
              {loading && <span className="dg-helper" role="status">正在更新結果…</span>}
            </div>
          )}
          <div className="dg-contracts-list">
            {rows.map((r) => {
              const tpl = r.templateId ? getTemplate(r.templateId) : null;
              const overdue = r.milestones.filter((m) => m.status === "OVERDUE").length;
              const signingStatus = STATUSES.find((item) => item.value === r.signingStatus)?.label ?? r.signingStatus;
              return (
                <Link key={r.id} href={`/contracts/${r.id}`} className="card card-hover dg-list-item dg-contracts-list-item">
                  <div className="dg-contracts-list-item__content">
                    <div className="dg-contracts-list-item__heading">
                      <Icon name={tpl?.icon || "fileText"} size={16} />
                      <h3 className="dg-subsection-title dg-contracts-list-item__title">{contractTitle(r.templateId || "", r.values)}</h3>
                      <span className="chip chip-zinc">{signingStatus}</span>
                      {r.case && (
                        <span className="chip chip-zinc dg-contracts-case-chip">
                          <Icon name="folder" size={10} />{r.case.title}
                        </span>
                      )}
                      {overdue > 0 && (
                        <span className="chip chip-bad">
                          逾期 {overdue}
                        </span>
                      )}
                    </div>
                    <div className="dg-contracts-metadata">
                      <span>{r.client || "—"} → {r.recipientName || "—"}</span>
                      {r.recipientEmail && <span>{r.recipientEmail}</span>}
                      <time dateTime={r.createdAt}>{new Date(r.createdAt).toLocaleDateString("zh-Hant")}</time>
                    </div>
                  </div>
                  <Icon name="chevronRight" size={16} className="dg-contracts-list-item__chevron" />
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
