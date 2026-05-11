"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { MilestoneModal } from "@/components/MilestoneModal";
import { AttachToCaseModal } from "@/components/AttachToCaseModal";
import { RiskCheckPanel } from "@/components/RiskCheckPanel";
import { getTemplate } from "@/lib/templates";

type Milestone = {
  id: string;
  kind: string;
  title: string;
  amount: number | null;
  dueDate: string;
  status: string;
};
type Data = {
  contract: {
    id: string;
    templateId: string | null;
    values: Record<string, string>;
    signingStatus: string;
    senderName: string;
    recipientName: string | null;
    recipientEmail: string | null;
    senderSignedAt: string | null;
    recipientSignedAt: string | null;
    senderHashShort: string | null;
    recipientHashShort: string | null;
    createdAt: string;
  };
  milestones: Milestone[];
  case: { id: string; title: string; status: string } | null;
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

export default function ContractViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showMs, setShowMs] = useState(false);
  const [showAttach, setShowAttach] = useState(false);

  async function load() {
    try {
      const r = await fetch(`/api/contracts/${id}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
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
      await fetch(`/api/milestones/${mid}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div style={{ padding: 32 }}>讀取失敗：{error}</div>;
  if (!data) return <div style={{ padding: 32 }}>載入中…</div>;

  const tpl = data.contract.templateId ? getTemplate(data.contract.templateId) : null;

  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "32px 32px 16px", maxWidth: 1100 }}>
          <Link href="/cases" style={{ fontSize: 13, color: "var(--ink-muted)" }}>
            <Icon name="arrowLeft" size={12} /> 返回案件
          </Link>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
            <h1 style={{ fontSize: 36 }}>
              {tpl?.name || data.contract.templateId || "合約"}
              <span className="chip chip-zinc" style={{ fontSize: 12, marginLeft: 12, verticalAlign: "middle" }}>
                {data.contract.signingStatus}
              </span>
            </h1>
            <div className="row gap-2">
              <button className="btn btn-soft" onClick={() => setShowMs(true)}>
                <Icon name="plus" size={13} />新增追蹤項目
              </button>
              <button className="btn btn-soft" onClick={() => setShowAttach(true)}>
                <Icon name="folder" size={13} />
                {data.case ? `案件：${data.case.title}` : "指派到案件"}
              </button>
              <Link href={`/contracts/${data.contract.id}/versions`} className="btn btn-soft">
                <Icon name="hash" size={13} />版本紀錄
              </Link>
            </div>
          </div>
          <div className="row gap-3" style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8, flexWrap: "wrap" }}>
            <span>甲方：{data.contract.senderName}</span>
            <span>乙方：{data.contract.recipientName || "—"}</span>
            <span>建立：{new Date(data.contract.createdAt).toLocaleDateString("zh-Hant")}</span>
            <span>ID：{data.contract.id}</span>
          </div>
        </section>

        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 1100 }}>
          <div className="dg-fields-2col" style={{ gap: 16 }}>
            <div className="card" style={{ padding: 16, background: "var(--bg-elev)", border: "1px solid var(--line)" }}>
              <div className="row gap-2" style={{ marginBottom: 8 }}>
                <Icon name="pen" size={14} /><b>甲方簽署</b>
              </div>
              {data.contract.senderSignedAt ? (
                <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                  {new Date(data.contract.senderSignedAt).toLocaleString("zh-Hant")}
                  <br />
                  簽名雜湊 #{data.contract.senderHashShort}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>尚未簽署</div>
              )}
            </div>
            <div className="card" style={{ padding: 16, background: "var(--bg-elev)", border: "1px solid var(--line)" }}>
              <div className="row gap-2" style={{ marginBottom: 8 }}>
                <Icon name="pen" size={14} /><b>乙方簽署</b>
              </div>
              {data.contract.recipientSignedAt ? (
                <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                  {new Date(data.contract.recipientSignedAt).toLocaleString("zh-Hant")}
                  <br />
                  簽名雜湊 #{data.contract.recipientHashShort}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                  尚未簽署（簽署連結：寄送給 {data.contract.recipientEmail || "—"}）
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="container" style={{ padding: "0 32px 24px", maxWidth: 1100 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>追蹤項目 ({data.milestones.length})</h2>
          {data.milestones.length === 0 ? (
            <div className="card" style={{ padding: 16, color: "var(--ink-muted)", fontSize: 13 }}>
              尚無付款 / 交付追蹤。
              {tpl?.id === "freelance" && " 提示：本合約可從付款條件自動產生 milestone。"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.milestones.map((m) => {
                const due = new Date(m.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
                return (
                  <div key={m.id} className="row"
                    style={{
                      padding: "10px 14px", border: "1px solid var(--line)",
                      borderRadius: "var(--radius)", justifyContent: "space-between",
                      alignItems: "center", background: "var(--bg-elev)",
                    }}
                  >
                    <div className="row gap-3">
                      <span className="chip chip-zinc" style={{ fontSize: 11 }}>{KIND_LABEL[m.kind] || m.kind}</span>
                      <span style={{ fontSize: 14 }}>{m.title}</span>
                      {m.amount != null && (
                        <span style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>NT$ {m.amount.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="row gap-3" style={{ fontSize: 12.5 }}>
                      <span style={{ color: "var(--ink-muted)" }}>
                        {due.toLocaleDateString("zh-Hant")}
                        <span style={{ marginLeft: 6, color: diff < 0 && m.status !== "DONE" ? "#7a1f1f" : "var(--ink-muted)" }}>
                          ({m.status === "DONE" ? "已完成" : diff < 0 ? `逾 ${-diff} 日` : `剩 ${diff} 日`})
                        </span>
                      </span>
                      <span style={{ color: STATUS_COLOR[m.status] || "#444", fontWeight: 600 }}>
                        {STATUS_LABEL[m.status] || m.status}
                      </span>
                      {(m.status === "OVERDUE" || diff < 0) && m.status !== "DONE" && m.kind === "PAYMENT" && (
                        <Link href={`/contracts/new?fromMilestone=${m.id}`} className="btn btn-soft btn-sm" title="從本逾期項目自動產生催款通知書">
                          <Icon name="mail" size={11} />催款
                        </Link>
                      )}
                      {m.status !== "DONE" && (
                        <button className="btn btn-soft btn-sm" onClick={() => setStatus(m.id, "DONE")} disabled={busy}>
                          <Icon name="check" size={11} />完成
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {tpl && (
          <section className="container" style={{ padding: "0 32px 64px", maxWidth: 1100 }}>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>風險檢查</h2>
            <RiskCheckPanel templateId={tpl.id} values={data.contract.values} context={tpl.name} />
          </section>
        )}

        <Footer />

        {showMs && (
          <MilestoneModal
            contractId={data.contract.id}
            onClose={() => setShowMs(false)}
            onDone={() => {
              setShowMs(false);
              load();
            }}
          />
        )}
        {showAttach && (
          <AttachToCaseModal
            contractId={data.contract.id}
            currentCaseId={data.case?.id ?? null}
            onClose={() => setShowAttach(false)}
            onDone={() => {
              setShowAttach(false);
              load();
            }}
          />
        )}
      </main>
    </>
  );
}
