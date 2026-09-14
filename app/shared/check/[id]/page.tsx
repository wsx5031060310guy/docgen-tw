import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { RiskFindingCard, RISK_LEVEL_CLASS, RISK_LEVEL_LABEL } from "@/components/RiskFindingCard";
import { prisma } from "@/lib/prisma";
import type { RiskFinding, RiskLevel } from "@/lib/risk-rules";

export const runtime = "nodejs";

interface Summary {
  level: RiskLevel;
  reds: number;
  yellows: number;
  needsLawyer: boolean;
  oneliner: string;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `合約風險快檢結果 #${id.slice(0, 6)} · DocGen TW`,
    description: "DocGen TW 規則式 + LLM 合約風險檢查結果",
    robots: { index: false }, // shared snapshot — don't index
  };
}

function SharedCheckState({
  title,
  description,
  actions,
  tone = "empty",
}: {
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  tone?: "empty" | "error";
}) {
  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-route-state-page">
        <section className={`card dg-route-state-card dg-route-state-card--${tone}`}>
          <span className="dg-route-state-code" aria-hidden="true">{tone === "error" ? "!" : "—"}</span>
          <h1 className="dg-page-title">{title}</h1>
          <p className="dg-text-secondary">{description}</p>
          {actions && <div className="dg-actions dg-route-state-actions">{actions}</div>}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default async function SharedCheckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) {
    return (
      <SharedCheckState
        title="分享快照暫不可用"
        description="分享連結需要資料庫支援，本部署未啟用。"
        tone="error"
        actions={<Link href="/check" className="btn btn-primary">返回風險快檢</Link>}
      />
    );
  }

  const row = await prisma.sharedCheck.findUnique({ where: { id } });
  if (!row) notFound();
  if (row.expiresAt < new Date()) {
    return (
      <SharedCheckState
        title="連結已過期"
        description={<>分享連結效期為 30 天，本連結建立於 {row.createdAt.toLocaleDateString("zh-Hant")}。</>}
        actions={<Link href="/check" className="btn btn-primary">重新檢查</Link>}
      />
    );
  }

  // best-effort view increment (don't await)
  prisma.sharedCheck.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => undefined);

  const summary = row.summary as unknown as Summary;
  const findings = row.findings as unknown as RiskFinding[];
  const summaryStyle = RISK_LEVEL_CLASS[summary.level];

  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-shared-check-page">
        <header className="dg-page-shell dg-check-shell dg-shared-check-header">
          <div className="dg-eyebrow dg-check-eyebrow"><Icon name="shieldCheck" size={13} />風險檢查結果 · 已分享</div>
          <h1 className="dg-page-title">合約風險快檢結果</h1>
          <dl className="dg-shared-check-meta">
            <div><dt>檢查時間</dt><dd>{row.createdAt.toLocaleString("zh-Hant")}</dd></div>
            <div><dt>連結效期</dt><dd>{row.expiresAt.toLocaleDateString("zh-Hant")}</dd></div>
            <div><dt>檢查字數</dt><dd>{row.text.length.toLocaleString()}</dd></div>
          </dl>
        </header>

        <section className="dg-page-shell dg-check-shell dg-shared-check-section" aria-labelledby="shared-findings-title">
          <h2 id="shared-findings-title" className="dg-visually-hidden">風險項目</h2>
          <div className={`dg-notice dg-notice--${summaryStyle.notice} dg-risk-summary`}>
            <div className="dg-risk-summary__header">
              <Icon name={summaryStyle.icon} size={16} />
              <strong className="dg-risk-summary__title">{RISK_LEVEL_LABEL[summary.level]}</strong>
              <span className="dg-risk-summary__counts">紅 {summary.reds} · 黃 {summary.yellows}</span>
            </div>
            <p className="dg-risk-summary__oneliner">{summary.oneliner}</p>
          </div>
          {findings.length === 0 ? (
            <div className="dg-notice dg-notice--success dg-risk-status" role="status"><Icon name="checkCircle" size={14} /><span>未偵測到規則式紅旗。仍建議重要交易由律師審閱。</span></div>
          ) : (
            <div className="dg-risk-findings">{findings.map((finding, index) => <RiskFindingCard key={finding.id || index} finding={finding} />)}</div>
          )}
        </section>

        <section className="dg-page-shell dg-check-shell dg-shared-check-section" aria-labelledby="shared-source-title">
          <div className="card dg-card-compact dg-shared-source-card">
            <h2 id="shared-source-title" className="dg-subsection-title dg-check-card-heading"><Icon name="info" size={14} />合約原文（檢查當下）</h2>
            <pre className="dg-code-block dg-shared-source" tabIndex={0} aria-label="合約原文，可使用鍵盤捲動">{row.text}</pre>
          </div>
        </section>

        <section className="dg-page-shell dg-check-shell dg-shared-check-section">
          <div className="card dg-card-body dg-shared-check-cta">
            <h2 className="dg-subsection-title">想自己跑一份？</h2>
            <p className="dg-text-secondary">DocGen TW 規則式檢查涵蓋 15 條台灣常見高風險寫法，免費、免註冊、不儲存內容。</p>
            <div className="dg-actions">
              <Link href="/check" className="btn btn-primary btn-sm"><Icon name="shieldCheck" size={12} />開始檢查</Link>
              <Link href="/" className="btn btn-soft btn-sm"><Icon name="fileText" size={12} />使用範本建立合約</Link>
            </div>
          </div>
        </section>

        <section className="dg-page-shell dg-check-shell dg-check-disclaimer"><LegalDisclaimer /></section>
      </main>
      <Footer />
    </>
  );
}
