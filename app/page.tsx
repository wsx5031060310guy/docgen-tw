"use client";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { TrustBar } from "@/components/TrustBar";
import { TemplateCard } from "@/components/TemplateCard";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { BillingBanner } from "@/components/BillingBanner";
import { TEMPLATES } from "@/lib/templates";

export default function Home() {
  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container dg-hero-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <span style={{ width: 24, height: 1, background: "var(--ink-muted)" }} />
              台灣法律合約 · 自動產生 + 電子簽署
            </div>
            <h1 style={{ fontSize: 60 }}>
              3 分鐘產出
              <br />
              <span style={{ fontFamily: "var(--font-italic)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>
                可信
              </span>
              合約，
              <br />
              附完整法條依據。
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--ink-soft)", maxWidth: 540 }}>
              從 10 種常用範本開始（含催款通知書、存證信函草稿），逐欄填入即可產出。每一條款都附中華民國法令引用，雙方電子簽署留存 IP、時間戳與簽名雜湊 ——
              <span style={{ color: "var(--ink)" }}> 比律師快、比範本可信。</span>
            </p>
            <div style={{ marginTop: 6, marginBottom: -8 }}>
              <BillingBanner compact />
            </div>
            <div className="row gap-3 dg-hero-cta" style={{ marginTop: 6 }}>
              <Link href="/contracts/new" className="btn btn-primary btn-lg">
                <Icon name="sparkles" size={15} />
                開始建立合約
              </Link>
              <a
                className="btn btn-ghost btn-lg"
                onClick={() => document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Icon name="bookOpen" size={15} />
                瀏覽 10 種範本
              </a>
            </div>
            <div className="row gap-3" style={{ marginTop: 12, fontSize: 12.5, color: "var(--ink-muted)" }}>
              <span className="row gap-1">
                <Icon name="checkCircle" size={13} style={{ color: "var(--primary)" }} />
                電子簽章法 §4 合規
              </span>
              <span style={{ width: 1, height: 12, background: "var(--line)" }} />
              <span className="row gap-1">
                <Icon name="lock" size={13} style={{ color: "var(--primary)" }} />
                SSL 加密傳輸
              </span>
              <span style={{ width: 1, height: 12, background: "var(--line)" }} />
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
                boxShadow: "0 24px 50px rgba(20,29,68,0.16), 0 6px 14px rgba(20,29,68,0.06)",
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
                boxShadow: "0 12px 30px rgba(20,29,68,0.10)", zIndex: -1,
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

        <section className="container" style={{ padding: "0 32px 48px" }}>
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

        <section id="templates" className="container" style={{ padding: "24px 32px 64px" }}>
          <div className="row dg-templates-filter" style={{ justifyContent: "space-between", marginBottom: 24, alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                合約範本
              </div>
              <h2>挑一份開始</h2>
            </div>
            <div className="row gap-2">
              <input className="input" placeholder="搜尋範本..." style={{ width: 240 }} />
              <button className="btn btn-soft btn-sm">
                <Icon name="list" size={13} />全部 10 種
              </button>
            </div>
          </div>
          <div className="dg-templates-grid">
            {TEMPLATES.map((t) => (
              <TemplateCard key={t.id} tpl={t} />
            ))}
          </div>
        </section>

        <section className="container" style={{ padding: "24px 32px 80px" }}>
          <div style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            運作方式
          </div>
          <h2 style={{ marginBottom: 32 }}>三步完成，無需法律背景</h2>
          <div className="dg-howit-grid">
            {[
              { n: "01", icon: "fileText", t: "挑選範本", d: "從 10 種常用合約挑一個，或從空白模板自訂。每個範本均附法條依據。" },
              { n: "02", icon: "pen", t: "填寫表單", d: "左側填寫，右側即時預覽。系統自動將數字轉為國字大寫，逐條編號。" },
              { n: "03", icon: "fileSig", t: "雙方簽署", d: "寄送簽署連結給對方，IP 與時間戳自動留存，PDF 一鍵下載。" },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: "var(--primary)", color: "var(--primary-ink)",
                      display: "grid", placeItems: "center",
                    }}
                  >
                    <Icon name={s.icon} size={20} />
                  </div>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 600, color: "var(--line)", lineHeight: 1 }}>
                    {s.n}
                  </span>
                </div>
                <h3 style={{ fontSize: 20 }}>{s.t}</h3>
                <p style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.6 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="container" style={{ padding: "24px 32px 60px" }}>
          <div style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            價格
          </div>
          <h2 style={{ marginBottom: 12 }}>免費先用，需要再升級</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7, maxWidth: 640, marginBottom: 24 }}>
            所有方案均含 10 種範本、雙方電子簽署、PDF 存證、規則式風險檢查。差別只在<b>每月可建立的合約數</b>與<b>進階功能</b>。
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              {
                code: "free", name: "Free", price: "0", unit: "/月",
                tag: "適合偶爾接案",
                cta: "直接開始",
                href: "/contracts/new",
                features: [
                  "每月 3 份合約",
                  "10 種台灣法律範本",
                  "雙方電子簽署 + PDF",
                  "規則式風險檢查（15 條）",
                  "案件資料夾 + milestone 追蹤",
                ],
                featured: false,
              },
              {
                code: "pro", name: "Pro", price: "299", unit: "/月",
                tag: "頻繁使用 + Email 自動提醒",
                cta: "升級 Pro",
                href: "/checkout",
                features: [
                  "✓ Free 所有功能",
                  "**無限合約建立**",
                  "AI 風險檢查（Gemini 2.5）",
                  "milestone Email 自動提醒",
                  "Pro Badge + 優先客服",
                ],
                featured: true,
              },
              {
                code: "pack", name: "Pack", price: "499", unit: "/3 個月",
                tag: "三個月集中跑案",
                cta: "購買 90 日方案",
                href: "/checkout",
                features: [
                  "✓ Pro 所有功能",
                  "90 天無限合約（一次性付款）",
                  "省下 NT$398 (比月繳)",
                  "適合短期專案爆量",
                ],
                featured: false,
              },
            ].map((p) => (
              <div key={p.code} className="card" style={{
                padding: 22,
                background: p.featured ? "var(--primary-soft)" : "var(--bg-elev)",
                border: `${p.featured ? 2 : 1}px solid ${p.featured ? "var(--primary)" : "var(--line)"}`,
                borderRadius: "var(--radius)",
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: 22 }}>{p.name}</h3>
                  {p.featured && <span className="chip chip-zinc" style={{ background: "var(--primary)", color: "var(--primary-ink)", fontSize: 11 }}>推薦</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{p.tag}</div>
                <div>
                  <span style={{ fontSize: 36, fontWeight: 600 }}>NT$ {p.price}</span>
                  <span style={{ fontSize: 13, color: "var(--ink-muted)", marginLeft: 4 }}>{p.unit}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ fontSize: 13.5, color: "var(--ink-soft)", display: "flex", gap: 6 }}>
                      <Icon name="check" size={13} style={{ color: "var(--primary)", marginTop: 3 }} />
                      <span dangerouslySetInnerHTML={{ __html: f.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }} />
                    </li>
                  ))}
                </ul>
                <Link href={p.href} className={`btn ${p.featured ? "btn-primary" : "btn-soft"}`} style={{ marginTop: "auto" }}>
                  {p.cta}
                  <Icon name="arrowRight" size={13} />
                </Link>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, fontSize: 12.5, color: "var(--ink-muted)" }}>
            * Pro / Pack 用藍新金流結帳，不自動續約；到期後降回 Free（不會繼續扣款）。
          </div>
        </section>

        <section className="container" style={{ padding: "0 32px 60px" }}>
          <LegalDisclaimer />
        </section>

        <Footer />
      </main>
    </>
  );
}
