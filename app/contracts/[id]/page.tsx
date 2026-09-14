"use client";
import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { MilestoneModal } from "@/components/MilestoneModal";
import { AttachToCaseModal } from "@/components/AttachToCaseModal";
import { RiskCheckPanel } from "@/components/RiskCheckPanel";
import { UIState } from "@/components/UIState";
import { contractTitle, getTemplate } from "@/lib/templates";

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
const STATUS_CHIP: Record<string, string> = {
  PENDING: "chip-warn", DONE: "chip-good", OVERDUE: "chip-bad", CANCELLED: "chip-zinc",
};
const KIND_LABEL: Record<string, string> = {
  PAYMENT: "付款", DELIVERY: "交付", RENEWAL: "續約", CUSTOM: "其他",
};
const SIGNING_STATUS_LABEL: Record<string, string> = {
  UNSIGNED: "未簽",
  SENDER_SIGNED: "僅甲方簽",
  AWAITING_RECIPIENT: "待乙方簽",
  FULLY_SIGNED: "已雙簽",
};

export default function ContractViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showMs, setShowMs] = useState(false);
  const [showAttach, setShowAttach] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/contracts/${id}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
      setActionError(null);
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
    setActionError(null);
    try {
      const response = await fetch(`/api/milestones/${mid}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (e) {
      setActionError(`無法更新追蹤項目：${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const tpl = data?.contract.templateId ? getTemplate(data.contract.templateId) : null;
  const title = data ? contractTitle(data.contract.templateId || "", data.contract.values) : "合約詳情";

  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-contract-detail-page">
        <header className="dg-page-shell dg-contract-detail-header">
          <Link href="/cases" className="dg-link dg-contract-detail-back">
            <Icon name="arrowLeft" size={12} /> 返回案件
          </Link>
          <div className="dg-page-header dg-contract-detail-heading-row">
            <div className="dg-contract-detail-title-wrap">
              <h1 className="dg-page-title dg-contract-detail-title">{title}</h1>
              {data && <span className="chip chip-zinc">{SIGNING_STATUS_LABEL[data.contract.signingStatus] || data.contract.signingStatus}</span>}
            </div>
            {data && <div className="dg-actions dg-contract-detail-actions">
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
            </div>}
          </div>
          {data && <div className="dg-contract-detail-metadata">
            <span>甲方：{data.contract.senderName}</span>
            <span>乙方：{data.contract.recipientName || "—"}</span>
            <span>建立：<time dateTime={data.contract.createdAt}>{new Date(data.contract.createdAt).toLocaleDateString("zh-Hant")}</time></span>
            <span>ID：{data.contract.id}</span>
          </div>}
        </header>

        <div className="dg-page-shell dg-contract-detail-content" aria-busy={loading}>
          {loading && !data && <UIState status="loading" title="合約載入中" description="正在取得合約、簽署與追蹤資料。" />}
          {error && !data && (
            <UIState status="error" title="無法讀取合約" description={`讀取失敗：${error}`} actions={<button className="btn btn-primary" onClick={load}>重新載入</button>} />
          )}
          {error && data && (
            <div className="dg-notice dg-notice--error dg-contract-detail-notice" role="alert">
              <span>重新讀取失敗：{error}。目前顯示上次取得的資料。</span>
              <button className="btn btn-ghost btn-sm" onClick={load}>重新讀取</button>
            </div>
          )}

          {data && <>
        <section className="dg-contract-detail-section" aria-labelledby="signature-summary-title">
          <h2 id="signature-summary-title" className="dg-section-title">簽署摘要</h2>
          <div className="dg-fields-2col dg-signature-summary-grid">
            <article className="card dg-card-body dg-signature-summary-card">
              <h3 className="dg-subsection-title dg-signature-summary-card__title">
                <Icon name="pen" size={14} />甲方簽署
              </h3>
              {data.contract.senderSignedAt ? (
                <div className="dg-signature-summary-card__meta">
                  {new Date(data.contract.senderSignedAt).toLocaleString("zh-Hant")}
                  <span>簽名雜湊 #{data.contract.senderHashShort}</span>
                </div>
              ) : (
                <p className="dg-text-secondary">尚未簽署</p>
              )}
            </article>
            <article className="card dg-card-body dg-signature-summary-card">
              <h3 className="dg-subsection-title dg-signature-summary-card__title">
                <Icon name="pen" size={14} />乙方簽署
              </h3>
              {data.contract.recipientSignedAt ? (
                <div className="dg-signature-summary-card__meta">
                  {new Date(data.contract.recipientSignedAt).toLocaleString("zh-Hant")}
                  <span>簽名雜湊 #{data.contract.recipientHashShort}</span>
                </div>
              ) : (
                <p className="dg-text-secondary dg-contract-detail-wrap">
                  尚未簽署（簽署連結：寄送給 {data.contract.recipientEmail || "—"}）
                </p>
              )}
            </article>
          </div>
        </section>

        <section className="dg-contract-detail-section" aria-labelledby="milestones-title">
          <div className="dg-contract-detail-section__heading">
            <h2 id="milestones-title" className="dg-section-title">追蹤項目</h2>
            <span className="chip chip-zinc">{data.milestones.length} 項</span>
          </div>
          {actionError && (
            <div className="dg-notice dg-notice--error dg-contract-detail-notice" role="alert">
              <span>{actionError}。狀態未標示為完成。</span>
              <button className="btn btn-ghost btn-sm" onClick={load}>重新讀取狀態</button>
            </div>
          )}
          {data.milestones.length === 0 ? (
            <div className="card dg-card-body dg-text-secondary">
              尚無付款 / 交付追蹤。
              {tpl?.id === "freelance" && " 提示：本合約可從付款條件自動產生 milestone。"}
            </div>
          ) : (
            <div className="dg-milestone-list">
              {data.milestones.map((m) => {
                const due = new Date(m.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
                return (
                  <article key={m.id} className="card dg-card-compact dg-milestone-card">
                    <div className="dg-milestone-card__content">
                      <div className="dg-milestone-card__title-row">
                        <span className="chip chip-zinc">{KIND_LABEL[m.kind] || m.kind}</span>
                        <h3 className="dg-subsection-title dg-milestone-card__title">{m.title}</h3>
                      </div>
                      {m.amount != null && (
                        <span className="dg-text-secondary">NT$ {m.amount.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="dg-milestone-card__actions">
                      <span className="dg-milestone-card__date">
                        <time dateTime={m.dueDate}>{due.toLocaleDateString("zh-Hant")}</time>
                        <span className={diff < 0 && m.status !== "DONE" ? "dg-milestone-card__overdue" : ""}>
                          ({m.status === "DONE" ? "已完成" : diff < 0 ? `逾 ${-diff} 日` : `剩 ${diff} 日`})
                        </span>
                      </span>
                      <span className={`chip ${STATUS_CHIP[m.status] || "chip-zinc"}`}>
                        {STATUS_LABEL[m.status] || m.status}
                      </span>
                      {(m.status === "OVERDUE" || diff < 0) && m.status !== "DONE" && m.kind === "PAYMENT" && (
                        <Link href={`/contracts/new?fromMilestone=${m.id}`} className="btn btn-soft btn-sm" title="從本逾期項目自動產生催款通知書">
                          <Icon name="mail" size={11} />催款
                        </Link>
                      )}
                      {m.status !== "DONE" && (
                        <button className="btn btn-soft btn-sm" onClick={() => setStatus(m.id, "DONE")} disabled={busy} aria-busy={busy || undefined}>
                          <Icon name="check" size={11} />{busy ? "更新中…" : "完成"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {tpl && (
          <section className="dg-contract-detail-section" aria-labelledby="risk-check-title">
            <h2 id="risk-check-title" className="dg-section-title">風險檢查</h2>
            <RiskCheckPanel
              templateId={tpl.id}
              values={data.contract.values}
              context={contractTitle(tpl.id, data.contract.values)}
              headingLevel={3}
            />
          </section>
        )}

          </>}
        </div>

        <Footer />

        {showMs && data && (
          <MilestoneModal
            contractId={data.contract.id}
            onClose={() => setShowMs(false)}
            onDone={() => {
              setShowMs(false);
              load();
            }}
          />
        )}
        {showAttach && data && (
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
