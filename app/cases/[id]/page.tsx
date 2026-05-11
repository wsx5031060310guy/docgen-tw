"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { MilestoneModal } from "@/components/MilestoneModal";

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
const STATUS_COLOR: Record<string, string> = {
  PENDING: "#1f5a35", DONE: "#1f3a5a", OVERDUE: "#7a1f1f", CANCELLED: "#666",
};
const KIND_LABEL: Record<string, string> = {
  PAYMENT: "付款", DELIVERY: "交付", RENEWAL: "續約", CUSTOM: "其他",
};

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<CaseFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msFor, setMsFor] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch(`/api/cases/${id}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setData(j.case);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    load();
  }, [id]);

  async function setStatus(mid: string, status: string) {
    setBusy(true);
    try {
      const r = await fetch(`/api/milestones/${mid}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadAttachment(file: File) {
    const form = new FormData();
    form.append("file", file);
    setBusy(true);
    try {
      const r = await fetch(`/api/cases/${id}/attachments`, { method: "POST", body: form });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div style={{ padding: 32 }}>讀取失敗：{error}</div>;
  if (!data) return <div style={{ padding: 32 }}>載入中…</div>;

  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "32px 32px 16px", maxWidth: 1100 }}>
          <Link href="/cases" style={{ fontSize: 13, color: "var(--ink-muted)" }}>
            <Icon name="arrowLeft" size={12} /> 返回案件列表
          </Link>
          <h1 style={{ fontSize: 36, marginTop: 14 }}>{data.title}</h1>
          <div className="row gap-3" style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 6 }}>
            <span>客戶：{data.clientName || "—"}</span>
            <span>相對人：{data.counterparty || "—"}</span>
            <span>狀態：{data.status}</span>
            <span>建立：{new Date(data.createdAt).toLocaleDateString("zh-Hant")}</span>
          </div>
        </section>

        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 1100 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>合約 ({data.contracts.length})</h2>
          {data.contracts.length === 0 && (
            <div className="card" style={{ padding: 16, color: "var(--ink-muted)" }}>
              尚無合約。從「新增合約」建立後可在合約頁將其指派到本案件。
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.contracts.map((c) => (
              <div key={c.id} className="card" style={{ padding: 18, border: "1px solid var(--line)", borderRadius: "var(--radius)", background: "var(--bg-elev)" }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div className="row gap-2">
                    <Icon name="fileText" size={14} />
                    <b>{c.templateId || "—"}</b>
                    <span className="chip chip-zinc" style={{ fontSize: 11 }}>{c.signingStatus}</span>
                  </div>
                  <div className="row gap-2">
                    <Link href={`/contracts/${c.id}`} className="btn btn-soft btn-sm">
                      <Icon name="eye" size={12} />查看
                    </Link>
                    <button className="btn btn-soft btn-sm" onClick={() => setMsFor(c.id)} disabled={busy}>
                      <Icon name="plus" size={12} />新增追蹤
                    </button>
                  </div>
                </div>

                {c.milestones.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>尚未建立付款 / 交付追蹤項目</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {c.milestones.map((m) => {
                      const due = new Date(m.dueDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
                      return (
                        <div
                          key={m.id}
                          className="row"
                          style={{
                            padding: "10px 12px", border: "1px solid var(--line)",
                            borderRadius: "var(--radius)", justifyContent: "space-between",
                            alignItems: "center", background: "var(--bg-soft)",
                          }}
                        >
                          <div className="row gap-3">
                            <span className="chip chip-zinc" style={{ fontSize: 11 }}>{KIND_LABEL[m.kind] || m.kind}</span>
                            <span style={{ fontSize: 14 }}>{m.title}</span>
                            {m.amount != null && (
                              <span style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                                NT$ {m.amount.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="row gap-3" style={{ fontSize: 12.5 }}>
                            <span style={{ color: "var(--ink-muted)" }}>
                              到期 {due.toLocaleDateString("zh-Hant")}
                              {m.status !== "DONE" && (
                                <span style={{ marginLeft: 6, color: diffDays < 0 ? "#7a1f1f" : "var(--ink-muted)" }}>
                                  ({diffDays < 0 ? `已逾 ${-diffDays} 日` : `還剩 ${diffDays} 日`})
                                </span>
                              )}
                            </span>
                            <span style={{ color: STATUS_COLOR[m.status] || "#444", fontWeight: 600 }}>
                              {STATUS_LABEL[m.status] || m.status}
                            </span>
                            {m.status !== "DONE" && (
                              <button className="btn btn-soft btn-sm" onClick={() => setStatus(m.id, "DONE")} disabled={busy}>
                                <Icon name="check" size={11} />標記完成
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="container" style={{ padding: "12px 32px 64px", maxWidth: 1100 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>附件 ({data.attachments.length})</h2>
          <label className="btn btn-soft" style={{ width: "fit-content", cursor: "pointer" }}>
            <Icon name="upload" size={13} />上傳附件
            <input
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAttachment(f);
                e.target.value = "";
              }}
            />
          </label>
          {data.attachments.length === 0 ? (
            <div style={{ marginTop: 10, color: "var(--ink-muted)", fontSize: 13 }}>尚無附件</div>
          ) : (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {data.attachments.map((a) => (
                <a key={a.id} href={a.blobUrl} target="_blank" rel="noreferrer"
                  className="card"
                  style={{
                    padding: 12, border: "1px solid var(--line)", borderRadius: "var(--radius)",
                    background: "var(--bg-elev)", textDecoration: "none", color: "inherit",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <div className="row gap-2">
                    <Icon name="paperclip" size={13} />
                    <span style={{ fontSize: 14 }}>{a.filename}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                    {a.mimeType || ""} · {a.sizeBytes ? Math.round(a.sizeBytes / 1024) + " KB" : ""}
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>

        <Footer />

        {msFor && (
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
