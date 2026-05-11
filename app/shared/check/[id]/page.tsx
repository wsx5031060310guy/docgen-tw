import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
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

const LEVEL_STYLE: Record<RiskLevel, { bg: string; border: string; ink: string; chip: string }> = {
  red: { bg: "#fde9e9", border: "#f1b5b5", ink: "#7a1f1f", chip: "#c4322a" },
  yellow: { bg: "var(--amber-50)", border: "#f0d9a4", ink: "#7a5a2a", chip: "var(--amber-600)" },
  "green-info": { bg: "#e8f5ed", border: "#bfe1c8", ink: "#1f5a35", chip: "#2e8b57" },
};
const LEVEL_LABEL: Record<RiskLevel, string> = { red: "紅燈", yellow: "黃燈", "green-info": "綠燈" };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `合約風險快檢結果 #${id.slice(0, 6)} · DocGen TW`,
    description: "DocGen TW 規則式 + LLM 合約風險檢查結果",
    robots: { index: false }, // shared snapshot — don't index
  };
}

export default async function SharedCheckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) {
    return (
      <main style={{ padding: 40 }}>
        分享連結需要資料庫支援，本部署未啟用。
      </main>
    );
  }
  const row = await prisma.sharedCheck.findUnique({ where: { id } });
  if (!row) notFound();
  if (row.expiresAt < new Date()) {
    return (
      <>
        <TopNav />
        <main className="page paper-bg" style={{ padding: 40 }}>
          <h1>連結已過期</h1>
          <p style={{ color: "var(--ink-muted)" }}>
            分享連結效期為 30 天，本連結建立於 {row.createdAt.toLocaleDateString("zh-Hant")}。
          </p>
          <Link href="/check" className="btn btn-primary">重新檢查</Link>
        </main>
      </>
    );
  }
  // best-effort view increment (don't await)
  prisma.sharedCheck.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => undefined);

  const summary = row.summary as unknown as Summary;
  const findings = row.findings as unknown as RiskFinding[];

  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "32px 32px 16px", maxWidth: 960 }}>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            <Icon name="shieldCheck" size={13} /> 風險檢查結果 · 已分享
          </div>
          <h1 style={{ fontSize: 36 }}>合約風險快檢結果</h1>
          <div className="row gap-3" style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 8, flexWrap: "wrap" }}>
            <span>檢查時間：{row.createdAt.toLocaleString("zh-Hant")}</span>
            <span>連結效期：{row.expiresAt.toLocaleDateString("zh-Hant")}</span>
            <span>檢查字數：{row.text.length.toLocaleString()}</span>
          </div>
        </section>

        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 960 }}>
          <div className="card" style={{
            padding: 18, background: LEVEL_STYLE[summary.level].bg,
            border: `1px solid ${LEVEL_STYLE[summary.level].border}`,
            color: LEVEL_STYLE[summary.level].ink,
            borderRadius: "var(--radius)", marginBottom: 14,
          }}>
            <div className="row gap-2" style={{ alignItems: "center" }}>
              <Icon
                name={summary.level === "red" ? "alertOctagon" : summary.level === "yellow" ? "alert" : "checkCircle"}
                size={16}
                style={{ color: LEVEL_STYLE[summary.level].chip }}
              />
              <b style={{ fontSize: 15 }}>{LEVEL_LABEL[summary.level]}</b>
              <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.85 }}>
                紅 {summary.reds} · 黃 {summary.yellows}
              </span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>{summary.oneliner}</div>
          </div>

          {findings.length === 0 ? (
            <div className="card" style={{ padding: 16, color: "var(--ink-muted)" }}>
              未偵測到規則式紅旗。仍建議重要交易由律師審閱。
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {findings.map((f, i) => {
                const fs = LEVEL_STYLE[f.level];
                return (
                  <div key={f.id || i} className="card" style={{
                    padding: 14, background: "var(--bg-elev)",
                    border: "1px solid var(--line)", borderRadius: "var(--radius)",
                  }}>
                    <div className="row gap-2" style={{ alignItems: "center", marginBottom: 6 }}>
                      <span style={{
                        display: "inline-flex", padding: "2px 8px", borderRadius: 999,
                        background: fs.bg, color: fs.ink, border: `1px solid ${fs.border}`,
                        fontSize: 11, fontWeight: 600,
                      }}>
                        {LEVEL_LABEL[f.level]}
                      </span>
                      <b style={{ fontSize: 14 }}>{f.title}</b>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: 6 }}>{f.detail}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink)" }}><b>建議：</b>{f.suggestion}</div>
                    {f.legalBasis.length > 0 && (
                      <div className="row gap-2" style={{ marginTop: 8, flexWrap: "wrap" }}>
                        {f.legalBasis.map((b) => (
                          <span key={b} className="chip chip-mono" style={{ fontSize: 11, padding: "2px 8px" }}>{b}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 960 }}>
          <div className="card" style={{
            padding: 16, background: "var(--bg-soft)",
            border: "1px solid var(--line)", borderRadius: "var(--radius)",
          }}>
            <div className="row gap-2"><Icon name="info" size={14} /><b>合約原文（檢查當下）</b></div>
            <pre style={{
              marginTop: 10, padding: 12, background: "var(--bg)",
              border: "1px solid var(--line)", borderRadius: 6,
              fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.7,
              whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto",
            }}>{row.text}</pre>
          </div>
        </section>

        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 960 }}>
          <div className="card" style={{
            padding: 18, background: "var(--bg-elev)",
            border: "1px solid var(--line)", borderRadius: "var(--radius)",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <b style={{ fontSize: 15 }}>想自己跑一份？</b>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: 0 }}>
              DocGen TW 規則式檢查涵蓋 15 條台灣常見高風險寫法，免費、免註冊、不儲存內容。
            </p>
            <div className="row gap-2">
              <Link href="/check" className="btn btn-primary btn-sm">
                <Icon name="shieldCheck" size={12} />開始檢查
              </Link>
              <Link href="/" className="btn btn-soft btn-sm">
                <Icon name="fileText" size={12} />使用範本建立合約
              </Link>
            </div>
          </div>
        </section>

        <section className="container" style={{ padding: "12px 32px 64px", maxWidth: 960 }}>
          <LegalDisclaimer />
        </section>

        <Footer />
      </main>
    </>
  );
}
