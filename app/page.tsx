"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { TrustBar } from "@/components/TrustBar";
import { TemplateCard } from "@/components/TemplateCard";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
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
        <section className="dg-page-shell dg-hero-grid dg-home-hero">
          <div className="dg-home-hero-copy">
            <h1 className="dg-page-title dg-home-title">
              建立可信合約，附完整法條依據。
            </h1>
            <p className="dg-body dg-home-lead">
              從 10 種合約與通知範本開始，逐欄填寫並即時預覽。完成後可送交雙方電子簽署，留存 IP、時間戳與簽名雜湊。
            </p>
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
                電子簽章法 §5、§6
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

          <figure className="dg-home-product-visual">
            <div className="dg-home-product-meta">
              <span>真實合約建立畫面</span>
              <span className="chip">示範資料</span>
            </div>
            <div className="dg-home-product-image">
              <Image
                src="/homepage-contract-builder.webp"
                alt="DocGen TW 建立新合約頁面，左側選擇範本，右側即時預覽契約"
                fill
                priority
                sizes="(min-width: 960px) 52vw, 100vw"
              />
            </div>
            <figcaption>選擇範本時，右側同步顯示契約內容與法條依據。</figcaption>
          </figure>
        </section>

        <section className="dg-page-shell dg-home-trust-section" aria-label="服務成果與信任指標">
          <TrustBar
            items={[
              { icon: "fileText", value: "10 種", label: "合約與通知範本" },
              { icon: "scale", value: "29 項", label: "範本列明法條引用" },
              { icon: "list", value: "4 階段", label: "選範本、填資訊、簽名、完成" },
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
          <div className="dg-home-howit-layout">
            <ol className="dg-home-step-list">
              {[
                { n: "01", icon: "fileText", t: "挑選範本", d: "從 10 種合約與通知範本開始，也可選擇自訂模板。" },
                { n: "02", icon: "pen", t: "填寫並預覽", d: "左側填寫資料，右側即時預覽契約內容與法條依據。" },
                { n: "03", icon: "fileSig", t: "送交雙方簽署", d: "寄送簽署連結，完成後下載留存 PDF。" },
              ].map((step) => (
                <li key={step.n} className="dg-home-step-row">
                  <div className="dg-home-step-icon"><Icon name={step.icon} size={20} /></div>
                  <div>
                    <span className="dg-home-step-number" aria-hidden="true">{step.n}</span>
                    <h3 className="dg-subsection-title">{step.t}</h3>
                    <p className="dg-text-secondary">{step.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <figure className="dg-home-howit-visual">
              <Image
                src="/homepage-contract-builder.webp"
                alt="DocGen TW 合約建立流程示範畫面"
                fill
                sizes="(min-width: 760px) 52vw, 100vw"
              />
              <figcaption>示範資料</figcaption>
            </figure>
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
