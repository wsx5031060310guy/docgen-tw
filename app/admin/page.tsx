"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { Suspense } from "react";

type OverdueMs = {
  id: string;
  kind: string;
  title: string;
  amount: number | null;
  dueDate: string;
  contract: {
    id: string;
    templateId: string | null;
    recipientName: string | null;
    recipientEmail: string | null;
    case: { id: string; title: string } | null;
  } | null;
};

type AdminContract = {
  id: string;
  templateId: string | null;
  client: string;
  recipientName: string | null;
  recipientEmail: string | null;
  signingStatus: string;
  uid: string | null;
  caseId: string | null;
  createdAt: string;
  milestones: { id: string; status: string }[];
  orders: { merchantTradeNo: string; planCode: string | null; amount: number; status: string }[];
};

type WebhookDelivery = {
  id: string;
  uid: string;
  event: string;
  url: string;
  status: number | null;
  ok: boolean;
  durationMs: number;
  reason: string | null;
  createdAt: string;
};

type UsageStats = {
  month: string;
  stats: {
    proActive: number;
    proExpired: number;
    totalUidsWithProfile: number;
    totalContracts: number;
    paidOrdersLast30: number;
    revenueLast30Ntd: number;
    conversionPct: number;
  };
  topUsageThisMonth: { id: string; uid: string; month: string; count: number }[];
  paidOrdersThisMonth: {
    id: string;
    merchantTradeNo: string;
    planCode: string | null;
    buyerEmail: string | null;
    amount: number;
    paymentDate: string | null;
    uid: string | null;
  }[];
};

type Referral = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  topic: string | null;
  budget: string | null;
  description: string;
  status: string;
  createdAt: string;
};

type Overview = {
  stats: {
    cases: number;
    contracts: number;
    milestones: number;
    overdueCount: number;
    outstandingNtd: number;
  };
  overdueMilestones: OverdueMs[];
  recentContracts: {
    id: string;
    templateId: string | null;
    signingStatus: string;
    recipientName: string | null;
    createdAt: string;
    case: { id: string; title: string } | null;
  }[];
  recentCases: {
    id: string;
    title: string;
    status: string;
    contracts: { id: string }[];
    attachments: { id: string }[];
    updatedAt: string;
  }[];
};

function AdminInner() {
  const params = useSearchParams();
  const keyParam = params.get("key");
  const [data, setData] = useState<Overview | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [hooks, setHooks] = useState<{ deliveries: WebhookDelivery[]; fails24h: number } | null>(null);
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [contractQ, setContractQ] = useState("");
  const [contractStatus, setContractStatus] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!keyParam) {
      setErr("缺少 ?key=<ADMIN_KEY> 參數");
      return;
    }
    document.cookie = `docgen_admin=${encodeURIComponent(keyParam)}; path=/; max-age=86400; SameSite=Lax`;
    Promise.all([
      fetch(`/api/admin/overview?key=${encodeURIComponent(keyParam)}`),
      fetch(`/api/admin/referrals?key=${encodeURIComponent(keyParam)}`),
      fetch(`/api/admin/usage?key=${encodeURIComponent(keyParam)}`),
      fetch(`/api/admin/webhooks?key=${encodeURIComponent(keyParam)}`),
    ])
      .then(async ([ro, rr, ru, rw]) => {
        if (ro.status === 401) throw new Error("ADMIN_KEY 不正確或未設定");
        if (!ro.ok) throw new Error(`HTTP ${ro.status}`);
        setData(await ro.json());
        if (rr.ok) {
          const j = await rr.json();
          setReferrals(j.referrals ?? []);
        }
        if (ru.ok) setUsage(await ru.json());
        if (rw.ok) setHooks(await rw.json());
      })
      .catch((e) => setErr((e as Error).message));
  }, [keyParam]);

  async function loadContracts() {
    if (!keyParam) return;
    const sp = new URLSearchParams({ key: keyParam });
    if (contractQ.trim()) sp.set("q", contractQ.trim());
    if (contractStatus) sp.set("status", contractStatus);
    try {
      const r = await fetch(`/api/admin/contracts?${sp.toString()}`);
      if (!r.ok) return;
      const j = await r.json();
      setContracts(j.contracts ?? []);
    } catch {}
  }
  useEffect(() => {
    if (data) loadContracts();
  }, [data, contractQ, contractStatus]);

  async function deleteContract(id: string) {
    if (!keyParam) return;
    if (!confirm(`真的要刪除合約 ${id.slice(0, 8)}…？（會 detach 訂單 + 連同 milestone 刪除）`)) return;
    const r = await fetch(`/api/admin/contracts?id=${encodeURIComponent(id)}&key=${encodeURIComponent(keyParam)}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    if (r.status === 409 && j.error) {
      if (!confirm(`此合約有 PAID 訂單 (${j.paidOrderId})。仍要強制刪除？`)) return;
      await fetch(`/api/admin/contracts?id=${encodeURIComponent(id)}&force=1&key=${encodeURIComponent(keyParam)}`, { method: "DELETE" });
    } else if (!r.ok) {
      alert(j.error || `HTTP ${r.status}`);
      return;
    }
    await loadContracts();
  }

  async function retryWebhooks() {
    if (!keyParam) return;
    const r = await fetch(`/api/admin/webhooks/retry?key=${encodeURIComponent(keyParam)}`, { method: "POST" });
    const j = await r.json();
    alert(j.error || `已重試 ${j.retried} 筆（${j.succeeded} 成功，${j.gaveUp} 放棄）`);
    // refresh deliveries panel
    fetch(`/api/admin/webhooks?key=${encodeURIComponent(keyParam)}`)
      .then((rr) => rr.ok && rr.json())
      .then((d) => d && setHooks(d))
      .catch(() => undefined);
  }

  async function setReferralStatus(id: string, status: string) {
    if (!keyParam) return;
    await fetch(`/api/admin/referrals?key=${encodeURIComponent(keyParam)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setReferrals((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  if (err) {
    return (
      <main className="page paper-bg" style={{ padding: 40 }}>
        <h1>Admin</h1>
        <p style={{ color: "var(--ink-muted)" }}>{err}</p>
        <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>
          用法：在網址列加 <code>?key=&lt;你 .env 設定的 ADMIN_KEY&gt;</code>
        </p>
      </main>
    );
  }
  if (!data) return <main className="page paper-bg" style={{ padding: 40 }}>載入中…</main>;

  const s = data.stats;
  return (
    <main className="page paper-bg">
      <section className="container" style={{ padding: "32px 32px 16px", maxWidth: 1200 }}>
        <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          <Icon name="shield" size={13} /> Admin
        </div>
        <h1 style={{ fontSize: 40 }}>後台總覽</h1>
      </section>

      <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 1200 }}>
        <div className="dg-fields-2col" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {[
            { label: "案件", value: s.cases, icon: "folder" },
            { label: "合約", value: s.contracts, icon: "fileText" },
            { label: "Milestones", value: s.milestones, icon: "calendar" },
            { label: "逾期", value: s.overdueCount, icon: "alert" },
            { label: "未收款 NT$", value: s.outstandingNtd.toLocaleString(), icon: "dollar" },
          ].map((c) => (
            <div key={c.label} className="card" style={{ padding: 16, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
              <div className="row gap-2" style={{ color: "var(--ink-muted)", fontSize: 12 }}>
                <Icon name={c.icon} size={12} />
                {c.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>{c.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 1200 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>逾期項目 ({data.overdueMilestones.length})</h2>
        {data.overdueMilestones.length === 0 ? (
          <div className="card" style={{ padding: 16, color: "var(--ink-muted)" }}>目前無逾期。</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.overdueMilestones.map((m) => {
              const due = new Date(m.dueDate);
              const today = new Date();
              const overdueDays = Math.round((today.getTime() - due.getTime()) / 86400000);
              return (
                <div key={m.id} className="card" style={{
                  padding: "10px 14px", background: "var(--bg-elev)", border: "1px solid var(--line)",
                  borderRadius: "var(--radius)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div className="row gap-2">
                      <span className="chip chip-zinc" style={{ fontSize: 11 }}>{m.kind}</span>
                      <b>{m.title}</b>
                      {m.amount != null && <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>NT$ {m.amount.toLocaleString()}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                      原訂 {due.toLocaleDateString("zh-Hant")} · 已逾 {overdueDays} 日 ·
                      乙方 {m.contract?.recipientName || "—"}
                      {m.contract?.case && <> · 案件 <Link href={`/cases/${m.contract.case.id}`} style={{ textDecoration: "underline" }}>{m.contract.case.title}</Link></>}
                    </div>
                  </div>
                  <div className="row gap-2">
                    {m.contract && (
                      <Link href={`/contracts/${m.contract.id}`} className="btn btn-soft btn-sm">
                        <Icon name="eye" size={11} />合約
                      </Link>
                    )}
                    {m.kind === "PAYMENT" && (
                      <Link href={`/contracts/new?fromMilestone=${m.id}`} className="btn btn-primary btn-sm">
                        <Icon name="mail" size={11} />生催款通知書
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 1200 }}>
        <div className="dg-fields-2col" style={{ gap: 16, alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 10 }}>最近合約</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.recentContracts.map((c) => (
                <Link key={c.id} href={`/contracts/${c.id}`} className="card" style={{
                  padding: "10px 14px", textDecoration: "none", color: "inherit",
                  background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
                  display: "flex", justifyContent: "space-between",
                }}>
                  <div>
                    <b>{c.templateId || "—"}</b>
                    <span style={{ fontSize: 12, color: "var(--ink-muted)", marginLeft: 6 }}>
                      → {c.recipientName || "—"}
                    </span>
                  </div>
                  <span className="chip chip-zinc" style={{ fontSize: 11 }}>{c.signingStatus}</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 10 }}>最近案件</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.recentCases.map((c) => (
                <Link key={c.id} href={`/cases/${c.id}`} className="card" style={{
                  padding: "10px 14px", textDecoration: "none", color: "inherit",
                  background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
                  display: "flex", justifyContent: "space-between",
                }}>
                  <div>
                    <b>{c.title}</b>
                    <span style={{ fontSize: 12, color: "var(--ink-muted)", marginLeft: 6 }}>
                      · {c.contracts.length} 合約 · {c.attachments.length} 附件
                    </span>
                  </div>
                  <span className="chip chip-zinc" style={{ fontSize: 11 }}>{c.status}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {usage && (
        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 1200 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>用量 & 收入</h2>
          <div className="dg-fields-2col" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {[
              { label: `本月 (${usage.month})`, value: usage.month, icon: "calendar" },
              { label: "PRO 啟用中", value: usage.stats.proActive, icon: "shieldCheck" },
              { label: "PRO 已過期", value: usage.stats.proExpired, icon: "clock" },
              { label: "近 30 日訂單", value: usage.stats.paidOrdersLast30, icon: "fileText" },
              { label: "近 30 日營收", value: `NT$ ${usage.stats.revenueLast30Ntd.toLocaleString()}`, icon: "dollar" },
              { label: "轉換率 (PRO/總)", value: `${usage.stats.conversionPct}%`, icon: "hash" },
            ].map((c) => (
              <div key={c.label} className="card" style={{ padding: 14, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
                <div className="row gap-2" style={{ color: "var(--ink-muted)", fontSize: 11.5 }}>
                  <Icon name={c.icon} size={11} />
                  {c.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{c.value}</div>
              </div>
            ))}
          </div>

          <div className="dg-fields-2col" style={{ gap: 16, marginTop: 20, alignItems: "flex-start" }}>
            <div>
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>本月用量 Top 20</h3>
              {usage.topUsageThisMonth.length === 0 ? (
                <div className="card" style={{ padding: 14, color: "var(--ink-muted)", fontSize: 13 }}>本月尚無使用紀錄</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {usage.topUsageThisMonth.map((u) => (
                    <div key={u.id} className="row" style={{
                      padding: "8px 12px", background: "var(--bg-elev)",
                      border: "1px solid var(--line)", borderRadius: "var(--radius)",
                      justifyContent: "space-between",
                    }}>
                      <code style={{ fontSize: 11.5, fontFamily: "var(--font-mono)" }}>{u.uid.slice(0, 12)}…</code>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{u.count} 份</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>本月付款訂單</h3>
              {usage.paidOrdersThisMonth.length === 0 ? (
                <div className="card" style={{ padding: 14, color: "var(--ink-muted)", fontSize: 13 }}>本月尚無付款訂單</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {usage.paidOrdersThisMonth.map((o) => (
                    <div key={o.id} className="row" style={{
                      padding: "8px 12px", background: "var(--bg-elev)",
                      border: "1px solid var(--line)", borderRadius: "var(--radius)",
                      justifyContent: "space-between", flexWrap: "wrap", gap: 6,
                    }}>
                      <span style={{ fontSize: 12.5 }}>
                        <span className="chip chip-zinc" style={{ fontSize: 10, marginRight: 6 }}>{o.planCode || "—"}</span>
                        {o.buyerEmail || "—"}
                      </span>
                      <span style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                        NT$ {o.amount.toLocaleString()} · {o.paymentDate ? new Date(o.paymentDate).toLocaleDateString("zh-Hant") : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {hooks && (
        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 1200 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ fontSize: 22 }}>Webhook 投遞紀錄</h2>
            <div className="row gap-2" style={{ alignItems: "center" }}>
              <span style={{ fontSize: 12.5, color: hooks.fails24h > 0 ? "#7a1f1f" : "var(--ink-muted)" }}>
                近 24 小時失敗 {hooks.fails24h} 次
              </span>
              <button className="btn btn-soft btn-sm" onClick={retryWebhooks}>
                <Icon name="refresh" size={11} />立即重試
              </button>
            </div>
          </div>
          {hooks.deliveries.length === 0 ? (
            <div className="card" style={{ padding: 16, color: "var(--ink-muted)", fontSize: 13 }}>尚無投遞紀錄。</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {hooks.deliveries.slice(0, 30).map((d) => (
                <div key={d.id} className="row" style={{
                  padding: "8px 12px", background: d.ok ? "var(--bg-elev)" : "#fde9e9",
                  border: `1px solid ${d.ok ? "var(--line)" : "#f1b5b5"}`, borderRadius: "var(--radius)",
                  justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 12.5,
                }}>
                  <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                    <span style={{ color: d.ok ? "#1f5a35" : "#7a1f1f", fontWeight: 600 }}>
                      {d.ok ? "✓" : "✗"} {d.status ?? "—"}
                    </span>
                    <span className="chip chip-zinc" style={{ fontSize: 11 }}>{d.event}</span>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{d.uid.slice(0, 10)}…</code>
                    <span style={{ color: "var(--ink-muted)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.url}
                    </span>
                  </div>
                  <div className="row gap-2" style={{ color: "var(--ink-muted)" }}>
                    <span>{d.durationMs} ms</span>
                    <span>{new Date(d.createdAt).toLocaleTimeString("zh-Hant")}</span>
                  </div>
                  {!d.ok && d.reason && (
                    <div style={{ flexBasis: "100%", fontSize: 11.5, color: "#7a1f1f", fontFamily: "var(--font-mono)" }}>
                      {d.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 1200 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>合約搜尋 & 強制刪除</h2>
        <div className="row gap-2" style={{ marginBottom: 12, flexWrap: "wrap" }}>
          <input className="input" placeholder="搜尋 id / 甲方 / 乙方 / Email / uid" value={contractQ} onChange={(e) => setContractQ(e.target.value)} style={{ minWidth: 240 }} />
          <select className="input" value={contractStatus} onChange={(e) => setContractStatus(e.target.value)}>
            <option value="">所有狀態</option>
            <option value="AWAITING_RECIPIENT">待乙方簽</option>
            <option value="FULLY_SIGNED">已雙簽</option>
            <option value="SENDER_SIGNED">僅甲方簽</option>
            <option value="UNSIGNED">未簽</option>
          </select>
        </div>
        {contracts.length === 0 ? (
          <div className="card" style={{ padding: 14, color: "var(--ink-muted)", fontSize: 13 }}>
            {(contractQ || contractStatus) ? "無符合條件" : "尚無合約"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {contracts.map((c) => (
              <div key={c.id} className="row" style={{
                padding: "10px 14px", background: "var(--bg-elev)",
                border: "1px solid var(--line)", borderRadius: "var(--radius)",
                justifyContent: "space-between", flexWrap: "wrap", gap: 8,
              }}>
                <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{c.id.slice(0, 10)}…</code>
                  <span className="chip chip-zinc" style={{ fontSize: 11 }}>{c.templateId || "—"}</span>
                  <span className="chip chip-zinc" style={{ fontSize: 11 }}>{c.signingStatus}</span>
                  <span style={{ fontSize: 12.5 }}>{c.client || "—"} → {c.recipientName || "—"}</span>
                  {c.orders.some((o) => o.status === "PAID") && (
                    <span className="chip chip-zinc" style={{ fontSize: 11, background: "#e8f5ed", color: "#1f5a35" }}>有 PAID 訂單</span>
                  )}
                </div>
                <div className="row gap-2">
                  <a href={`/contracts/${c.id}`} target="_blank" rel="noreferrer" className="btn btn-soft btn-sm">
                    <Icon name="eye" size={11} />開
                  </a>
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteContract(c.id)} style={{ color: "#7a1f1f" }}>
                    <Icon name="trash" size={11} />刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 1200 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>律師轉介 ({referrals.length})</h2>
        {referrals.length === 0 ? (
          <div className="card" style={{ padding: 16, color: "var(--ink-muted)" }}>目前無轉介需求。</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {referrals.map((r) => (
              <details key={r.id} className="card" style={{
                padding: 14, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
              }}>
                <summary style={{ cursor: "pointer", listStyle: "none" }}>
                  <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                      <b>{r.name}</b>
                      <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{r.email}</span>
                      {r.topic && <span className="chip chip-zinc" style={{ fontSize: 11 }}>{r.topic}</span>}
                      {r.city && <span className="chip chip-zinc" style={{ fontSize: 11 }}>{r.city}</span>}
                      {r.budget && <span className="chip chip-zinc" style={{ fontSize: 11 }}>{r.budget}</span>}
                    </div>
                    <div className="row gap-2">
                      <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                        {new Date(r.createdAt).toLocaleDateString("zh-Hant")}
                      </span>
                      <select value={r.status} onChange={(e) => setReferralStatus(r.id, e.target.value)} className="input" style={{ fontSize: 12, padding: "2px 6px" }}>
                        <option value="NEW">新進</option>
                        <option value="CONTACTED">已聯絡</option>
                        <option value="MATCHED">已媒合</option>
                        <option value="CLOSED">結案</option>
                      </select>
                    </div>
                  </div>
                </summary>
                <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.7, color: "var(--ink-soft)", whiteSpace: "pre-wrap" }}>
                  {r.description}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 8 }}>
                  電話：{r.phone || "—"}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}

export default function AdminPage() {
  return (
    <>
      <TopNav />
      <Suspense fallback={<div style={{ padding: 40 }}>載入中…</div>}>
        <AdminInner />
      </Suspense>
    </>
  );
}
