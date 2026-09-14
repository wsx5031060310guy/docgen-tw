"use client";
import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { MilestoneModal } from "@/components/MilestoneModal";
import { UIState } from "@/components/UIState";

type Milestone = {
  id: string;
  kind: string;
  title: string;
  amount: number | null;
  dueDate: string;
  status: string;
  doneAt: string | null;
  note: string | null;
};

type Contract = {
  id: string;
  templateId: string | null;
  signingStatus: string;
  expiryDate: string | null;
  createdAt: string;
  milestones: Milestone[];
};

type Attachment = {
  id: string;
  filename: string;
  blobUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

type CaseFull = {
  id: string;
  title: string;
  clientName: string | null;
  counterparty: string | null;
  notes: string | null;
  status: string;
  contracts: Contract[];
  attachments: Attachment[];
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待辦", DONE: "已完成", OVERDUE: "逾期", CANCELLED: "已取消",
};
const STATUS_CHIP: Record<string, string> = {
  PENDING: "chip-warn", DONE: "chip-good", OVERDUE: "chip-bad", CANCELLED: "chip-zinc",
};
const KIND_LABEL: Record<string, string> = {
  PAYMENT: "付款", DELIVERY: "交付", RENEWAL: "續約", CUSTOM: "其他",
};
const CASE_STATUS_LABEL: Record<string, string> = {
  OPEN: "進行中", CLOSED: "已結案", ARCHIVED: "已封存",
};
const SIGNING_STATUS_LABEL: Record<string, string> = {
  UNSIGNED: "未簽", SENDER_SIGNED: "僅甲方簽", AWAITING_RECIPIENT: "待乙方簽", FULLY_SIGNED: "已雙簽",
};

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<CaseFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msFor, setMsFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/cases/${id}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setData(j.case);
      setSubmitError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function setStatus(mid: string, status: string) {
    setBusy(true);
    setSubmitError(null);
    try {
      const r = await fetch(`/api/milestones/${mid}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await load();
    } catch (e) {
      setSubmitError(`無法更新追蹤項目：${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function uploadAttachment(file: File) {
    const form = new FormData();
    form.append("file", file);
    setBusy(true);
    setUploading(true);
    setSubmitError(null);
    try {
      const r = await fetch(`/api/cases/${id}/attachments`, { method: "POST", body: form });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      await load();
    } catch (e) {
      setSubmitError(`無法上傳附件：${(e as Error).message}`);
    } finally {
      setBusy(false);
      setUploading(false);
    }
  }

  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-case-detail-page">
        <header className="dg-page-shell dg-case-detail-header">
          <Link href="/cases" className="dg-link dg-contract-detail-back">
            <Icon name="arrowLeft" size={12} /> 返回案件列表
          </Link>
          <div className="dg-case-detail-title-row">
            <h1 className="dg-page-title dg-case-detail-title">{data?.title || "案件詳情"}</h1>
            {data && <span className="chip chip-zinc">{CASE_STATUS_LABEL[data.status] || data.status}</span>}
          </div>
          {data && <div className="dg-contract-detail-metadata">
            <span>客戶：{data.clientName || "—"}</span>
            <span>相對人：{data.counterparty || "—"}</span>
            <span>建立：<time dateTime={data.createdAt}>{new Date(data.createdAt).toLocaleDateString("zh-Hant")}</time></span>
          </div>}
        </header>

        <div className="dg-page-shell dg-case-detail-content" aria-busy={loading}>
          {loading && !data && <UIState status="loading" title="案件載入中" description="正在取得合約、追蹤項目與附件。" />}
          {error && !data && (
            <UIState status="error" title="無法讀取案件" description={`讀取失敗：${error}`} actions={<button className="btn btn-primary" onClick={load}>重新載入</button>} />
          )}
          {error && data && (
            <div className="dg-notice dg-notice--error dg-contract-detail-notice" role="alert">
              <span>重新讀取失敗：{error}。目前顯示上次取得的資料。</span>
              <button className="btn btn-ghost btn-sm" onClick={load}>重新讀取</button>
            </div>
          )}
          {submitError && (
            <div className="dg-notice dg-notice--error dg-contract-detail-notice" role="alert">
              <span>{submitError}</span>
              <button className="btn btn-ghost btn-sm" onClick={load}>重新讀取目前狀態</button>
            </div>
          )}

        {data && <>
        <section className="dg-case-detail-section" aria-labelledby="case-contracts-title">
          <div className="dg-contract-detail-section__heading">
            <h2 id="case-contracts-title" className="dg-section-title">合約</h2>
            <span className="chip chip-zinc">{data.contracts.length} 份</span>
          </div>
          {data.contracts.length === 0 && (
            <div className="card dg-card-body dg-text-secondary">
              尚無合約。從「新增合約」建立後可在合約頁將其指派到本案件。
            </div>
          )}
          <div className="dg-case-contract-list">
            {data.contracts.map((c) => (
              <article key={c.id} className="card dg-card-body dg-case-contract-card">
                <div className="dg-case-contract-card__header">
                  <div className="dg-case-contract-card__title-row">
                    <Icon name="fileText" size={14} />
                    <h3 className="dg-subsection-title dg-case-contract-card__title">{c.templateId || "—"}</h3>
                    <span className="chip chip-zinc">{SIGNING_STATUS_LABEL[c.signingStatus] || c.signingStatus}</span>
                  </div>
                  <div className="dg-actions dg-case-contract-card__actions">
                    <Link href={`/contracts/${c.id}`} className="btn btn-soft btn-sm">
                      <Icon name="eye" size={12} />查看
                    </Link>
                    <button className="btn btn-soft btn-sm" onClick={() => setMsFor(c.id)} disabled={busy}>
                      <Icon name="plus" size={12} />新增追蹤
                    </button>
                  </div>
                </div>

                {c.milestones.length === 0 ? (
                  <div className="dg-text-secondary">尚未建立付款 / 交付追蹤項目</div>
                ) : (
                  <div className="dg-case-milestone-list">
                    {c.milestones.map((m) => {
                      const due = new Date(m.dueDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
                      return (
                        <div key={m.id} className="dg-case-milestone-item">
                          <div className="dg-case-milestone-item__content">
                            <div className="dg-case-milestone-item__title-row">
                              <span className="chip chip-zinc">{KIND_LABEL[m.kind] || m.kind}</span>
                              <h4 className="dg-subsection-title dg-case-milestone-item__title">{m.title}</h4>
                            </div>
                            {m.amount != null && (
                              <span className="dg-text-secondary">
                                NT$ {m.amount.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="dg-case-milestone-item__actions">
                            <span className="dg-milestone-card__date">
                              到期 <time dateTime={m.dueDate}>{due.toLocaleDateString("zh-Hant")}</time>
                              {m.status !== "DONE" && (
                                <span className={diffDays < 0 ? "dg-milestone-card__overdue" : ""}>
                                  ({diffDays < 0 ? `已逾 ${-diffDays} 日` : `還剩 ${diffDays} 日`})
                                </span>
                              )}
                            </span>
                            <span className={`chip ${STATUS_CHIP[m.status] || "chip-zinc"}`}>
                              {STATUS_LABEL[m.status] || m.status}
                            </span>
                            {(m.status === "OVERDUE" || diffDays < 0) && m.status !== "DONE" && m.kind === "PAYMENT" && (
                              <Link href={`/contracts/new?fromMilestone=${m.id}`} className="btn btn-soft btn-sm">
                                <Icon name="mail" size={11} />催款
                              </Link>
                            )}
                            {m.status !== "DONE" && (
                              <button className="btn btn-soft btn-sm" onClick={() => setStatus(m.id, "DONE")} disabled={busy} aria-busy={busy || undefined}>
                                <Icon name="check" size={11} />{busy ? "更新中…" : "標記完成"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="dg-case-detail-section" aria-labelledby="case-attachments-title">
          <div className="dg-contract-detail-section__heading dg-case-attachments-heading">
            <div className="dg-case-attachments-title-row">
              <h2 id="case-attachments-title" className="dg-section-title">附件</h2>
              <span className="chip chip-zinc">{data.attachments.length} 個</span>
            </div>
          <label className="btn btn-soft dg-upload-label" aria-disabled={busy || undefined} aria-busy={uploading || undefined}>
            <Icon name="upload" size={13} />{uploading ? "上傳中…" : "上傳附件"}
            <input
              type="file"
              className="dg-visually-hidden dg-upload-input"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAttachment(f);
                e.target.value = "";
              }}
            />
          </label>
          </div>
          {data.attachments.length === 0 ? (
            <div className="card dg-card-body dg-text-secondary">尚無附件</div>
          ) : (
            <div className="dg-attachment-list">
              {data.attachments.map((a) => (
                <a key={a.id} href={a.blobUrl} target="_blank" rel="noreferrer"
                  className="card card-hover dg-card-compact dg-attachment-item"
                >
                  <div className="dg-attachment-item__name">
                    <Icon name="paperclip" size={13} />
                    <h3 className="dg-subsection-title">{a.filename}</h3>
                  </div>
                  <span className="dg-attachment-item__meta">
                    {a.mimeType || "未知格式"}{a.sizeBytes != null ? ` · ${Math.round(a.sizeBytes / 1024)} KB` : ""}
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>

        </>}
        </div>

        <Footer />

        {msFor && data && (
          <MilestoneModal
            contractId={msFor}
            onClose={() => setMsFor(null)}
            onDone={() => {
              setMsFor(null);
              load();
            }}
          />
        )}
      </main>
    </>
  );
}
