"use client";
import { useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { TrustBar } from "@/components/TrustBar";
import { TemplateCard } from "@/components/TemplateCard";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { BillingBanner } from "@/components/BillingBanner";
import { PlanCard, type Plan } from "@/components/PlanCard";
import { UIState } from "@/components/UIState";
import { TEMPLATES } from "@/lib/templates";

const HOME_PLANS: { plan: Plan; href: string; featured: boolean }[] = [
  {
    plan: {
      code: "free", name: "Free", price: "0", unit: "月",
      tag: "", tagline: "適合偶爾接案", cta: "直接開始",
      features: [
        "每月 3 份合約",
        "10 種台灣法律範本",
        "雙方電子簽署 + PDF",
        "規則式風險檢查（15 條）",
        "案件資料夾 + milestone 追蹤",
      ],
    },
    href: "/contracts/new",
    featured: false,
  },
  {
    plan: {
      code: "pro", name: "Pro", price: "299", unit: "月",
      tag: "", tagline: "頻繁使用 + Email 自動提醒", cta: "升級 Pro",
      features: [
        "✓ Free 所有功能",
        "無限合約建立",
        "AI 風險檢查（Gemini 2.5）",
        "milestone Email 自動提醒",
        "Pro Badge + 優先客服",
      ],
    },
    href: "/checkout",
    featured: true,
  },
  {
    plan: {
      code: "pack", name: "Pack", price: "499", unit: "3 個月",
      tag: "", tagline: "三個月集中跑案", cta: "購買 90 日方案",
      features: [
        "✓ Pro 所有功能",
        "90 天無限合約（一次性付款）",
        "省下 NT$398 (比月繳)",
        "適合短期專案爆量",
      ],
    },
    href: "/checkout",
    featured: false,
  },
];

export default function Home() {
  const [templateQuery, setTemplateQuery] = useState("");
  const normalizedQuery = templateQuery.trim().toLocaleLowerCase("zh-Hant");
  const filteredTemplates = normalizedQuery
    ? TEMPLATES.filter((template) => (
        [template.name, template.category, template.description, ...template.legal]
          .join(" ")
          .toLocaleLowerCase("zh-Hant")
          .includes(normalizedQuery)
      ))
    : TEMPLATES;

  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="dg-page-shell dg-hero-grid">
          <div className="dg-home-hero-copy">
            <div className="dg-eyebrow dg-home-eyebrow">
              <span className="dg-home-eyebrow-line" aria-hidden="true" />
              台灣法律合約 · 自動產生 + 電子簽署
            </div>
            <h1 className="dg-page-title dg-home-title">
              3 分鐘產出
              <br />
              <span style={{ fontFamily: "var(--font-italic)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>
                可信
              </span>
              合約，
              <br />
              附完整法條依據。
            </h1>
            <p className="dg-body dg-home-lead">
              從 10 種常用範本開始（含催款通知書、存證信函草稿），逐欄填入即可產出。每一條款都附中華民國法令引用，雙方電子簽署留存 IP、時間戳與簽名雜湊 ——
              <span style={{ color: "var(--ink)" }}> 比律師快、比範本可信。</span>
            </p>
            <div className="dg-home-billing">
              <BillingBanner compact />
            </div>
            <div className="dg-actions dg-hero-cta">
              <Link href="/contracts/new" className="btn btn-primary btn-lg">
                <Icon name="sparkles" size={15} />
                開始建立合約
              </Link>
              <a href="#templates" className="btn btn-ghost btn-lg">
                <Icon name="bookOpen" size={15} />
                瀏覽 10 種範本
              </a>
            </div>
            <div className="dg-home-trust-notes">
              <span className="row gap-1">
                <Icon name="checkCircle" size={13} style={{ color: "var(--primary)" }} />
                電子簽章法 §4 合規
              </span>
              <span aria-hidden="true" style={{ width: 1, height: 12, background: "var(--line)" }} />
              <span className="row gap-1">
                <Icon name="lock" size={13} style={{ color: "var(--primary)" }} />
                SSL 加密傳輸
              </span>
              <span aria-hidden="true" style={{ width: 1, height: 12, background: "var(--line)" }} />
              <span className="row gap-1">
                <Icon name="hash" size={13} style={{ color: "var(--primary)" }} />
                簽名雜湊存證
              </span>
            </div>
          </div>

          <div className="dg-hero-visual">
            <div
              className="paper"
              style={{
                position: "absolute", right: 0, top: 24,
                width: 380, height: 460, padding: "32px 36px",
                transform: "rotate(2.2deg)",
                boxShadow: "var(--shadow-sm)",
                fontFamily: "var(--font-serif)", color: "#1a1612", borderRadius: 4,
              }}
            >
              <div style={{ textAlign: "center", borderBottom: "1px solid rgba(0,0,0,0.12)", paddingBottom: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#856b4a" }}>DOCGEN TW</div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.18em", marginTop: 4 }}>承　攬　契　約</div>
              </div>
              {[
                { t: "第 一 條　工作範圍", body: "乙方應為甲方完成下列工作：品牌識別系統設計，含 logo、配色與字型規範……" },
                { t: "第 二 條　報酬", body: "本契約之報酬總額為新臺幣 拾貳萬 元整（NT$ 120,000）。" },
                { t: "第 三 條　智慧財產權", body: "乙方完成之工作成果，自報酬全額給付完成之日起，全部歸甲方所有……" },
              ].map((c, i) => (
                <div key={i} style={{ marginBottom: 11, fontSize: 11.5, lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2, letterSpacing: "0.04em" }}>{c.t}</div>
                  <div style={{ textIndent: "2em", color: "#1a1612" }}>{c.body}</div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 22, fontSize: 10 }}>
                <span className="chip chip-mono" style={{ fontSize: 9, padding: "1px 6px", fontFamily: "var(--font-sans)" }}>
                  民法 §490
                </span>
                <span className="chip chip-mono" style={{ fontSize: 9, padding: "1px 6px", fontFamily: "var(--font-sans)" }}>
                  著作權法 §12
                </span>
              </div>
            </div>
            <div
              style={{
                position: "absolute", right: 30, top: 60, width: 360, height: 440,
                background: "#efe6cf", borderRadius: 4, transform: "rotate(-3deg)",
                boxShadow: "var(--shadow-sm)", zIndex: -1,
              }}
            />
            <div
              className="stamp"
              style={{ position: "absolute", right: 60, top: 160, ["--stamp-size" as string]: "128px" }}
            >
              <div className="stamp-line1">DOCGEN</div>
              <div className="stamp-star">✦</div>
              <div className="stamp-line2">已簽署</div>
            </div>
            <div
              style={{
                position: "absolute", left: 30, bottom: 30, padding: "10px 14px",
                background: "var(--bg-elev)", border: "1px solid var(--line)",
                borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)",
                fontSize: 12, maxWidth: 240,
              }}
            >
              <div className="row gap-2" style={{ color: "var(--primary)" }}>
                <Icon name="scale" size={13} />
                <b>每條款附法令依據</b>
              </div>
              <div style={{ color: "var(--ink-soft)", marginTop: 4 }}>hover 法條 chip 即可看到完整條文</div>
            </div>
          </div>
        </section>

        <section className="dg-page-shell dg-home-trust-section" aria-label="服務成果與信任指標">
          <TrustBar
            items={[
              { icon: "fileText", value: "12,480", label: "已產出合約" },
              { icon: "scale", value: "23 條", label: "中華民國法令" },
              { icon: "shieldCheck", value: "§4 合規", label: "電子簽章法" },
              { icon: "users", value: "4,200+", label: "使用者" },
              { icon: "clock", value: "< 3 min", label: "平均完成時間" },
            ]}
          />
        </section>

        <section id="templates" className="dg-page-shell dg-section dg-home-section">
          <div className="dg-templates-filter">
            <div>
              <div className="dg-eyebrow">
                合約範本
              </div>
              <h2 className="dg-section-title">挑一份開始</h2>
            </div>
            <div className="dg-template-search" role="search" aria-label="搜尋合約範本">
              <label htmlFor="template-search" className="dg-visually-hidden">搜尋合約範本</label>
              <input
                id="template-search"
                className="input dg-template-search-input"
                type="search"
                value={templateQuery}
                onChange={(event) => setTemplateQuery(event.target.value)}
                placeholder="搜尋範本..."
              />
              <button
                type="button"
                className="btn btn-soft btn-sm"
                onClick={() => setTemplateQuery("")}
                aria-pressed={!normalizedQuery}
                aria-label="清除範本搜尋，顯示全部 10 種"
              >
                <Icon name="list" size={13} />全部 10 種
              </button>
            </div>
          </div>
          {normalizedQuery && (
            <p className="dg-helper dg-template-result-count" role="status">
              顯示 {filteredTemplates.length} 種範本
            </p>
          )}
          <div className="dg-templates-grid">
            {filteredTemplates.map((t) => (
              <TemplateCard key={t.id} tpl={t} />
            ))}
            {filteredTemplates.length === 0 && (
              <UIState
                status="empty"
                title="找不到符合的範本"
                description={`沒有符合「${templateQuery.trim()}」的範本。`}
                className="dg-template-empty"
                actions={(
                  <button type="button" className="btn btn-soft" onClick={() => setTemplateQuery("")}>
                    清除搜尋
                  </button>
                )}
              />
            )}
          </div>
        </section>

        <section className="dg-page-shell dg-section dg-home-section">
          <div className="dg-eyebrow">
            運作方式
          </div>
          <h2 className="dg-section-title dg-home-section-title">三步完成，無需法律背景</h2>
          <div className="dg-howit-grid">
            {[
              { n: "01", icon: "fileText", t: "挑選範本", d: "從 10 種常用合約挑一個，或從空白模板自訂。每個範本均附法條依據。" },
              { n: "02", icon: "pen", t: "填寫表單", d: "左側填寫，右側即時預覽。系統自動將數字轉為國字大寫，逐條編號。" },
              { n: "03", icon: "fileSig", t: "雙方簽署", d: "寄送簽署連結給對方，IP 與時間戳自動留存，PDF 一鍵下載。" },
            ].map((s, i) => (
              <div key={i} className="card dg-card-body dg-home-step">
                <div className="dg-home-step-header">
                  <div className="dg-home-step-icon">
                    <Icon name={s.icon} size={20} />
                  </div>
                  <span className="dg-home-step-number" aria-hidden="true">
                    {s.n}
                  </span>
                </div>
                <h3 className="dg-subsection-title">{s.t}</h3>
                <p className="dg-text-secondary">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="dg-page-shell dg-section dg-home-section">
          <div className="dg-eyebrow">
            價格
          </div>
          <h2 className="dg-section-title dg-home-pricing-title">免費先用，需要再升級</h2>
          <p className="dg-body dg-home-pricing-copy">
            所有方案均含 10 種範本、雙方電子簽署、PDF 存證、規則式風險檢查。差別只在<b>每月可建立的合約數</b>與<b>進階功能</b>。
          </p>
          <div className="dg-home-pricing-grid">
            {HOME_PLANS.map(({ plan, href, featured }) => (
              <PlanCard
                key={plan.code}
                plan={plan}
                href={href}
                featured={featured}
                featuredLabel="推薦"
              />
            ))}
          </div>
          <div className="dg-helper dg-home-pricing-note">
            * Pro / Pack 用藍新金流結帳，不自動續約；到期後降回 Free（不會繼續扣款）。
          </div>
        </section>

        <section className="dg-page-shell dg-home-disclaimer-section">
          <LegalDisclaimer />
        </section>

        <Footer />
      </main>
    </>
  );
}
