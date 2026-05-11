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
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!keyParam) {
      setErr("缺少 ?key=<ADMIN_KEY> 參數");
      return;
    }
    document.cookie = `docgen_admin=${encodeURIComponent(keyParam)}; path=/; max-age=86400; SameSite=Lax`;
    fetch(`/api/admin/overview?key=${encodeURIComponent(keyParam)}`)
      .then(async (r) => {
        if (r.status === 401) throw new Error("ADMIN_KEY 不正確或未設定");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setData(await r.json());
      })
      .catch((e) => setErr((e as Error).message));
  }, [keyParam]);

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
