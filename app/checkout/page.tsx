"use client";
import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { PlanCard, type Plan } from "@/components/PlanCard";

const PLANS: Plan[] = [
  {
    code: "pro", tag: "Pro", name: "Pro 月方案",
    tagline: "頻繁建合約 / 接案 / 小公司",
    price: "299", unit: "月", cta: "升級 Pro 30 天",
    features: [
      "無限合約建立（解除每月 3 份限制）",
      "10 種台灣法律範本",
      "AI 風險檢查（Gemini 2.5）",
      "milestone Email 自動提醒",
      "Pro Badge + 優先客服",
    ],
  },
  {
    code: "pack", tag: "Pack", name: "90 日方案",
    tagline: "三個月集中跑案、季結算",
    price: "499", unit: "3 個月", cta: "購買 90 日方案",
    features: [
      "Pro 全部功能 × 90 天",
      "一次性付款，不自動續約",
      "比月繳省 NT$398",
      "適合短期專案爆量",
      "到期降回 Free（不扣款）",
    ],
  },
];

export default function CheckoutPage() {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);

  async function pay(planCode: string) {
    setEmailErr(null);
    const e = email.trim();
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) {
      setEmailErr("請先輸入有效 Email（付款收據與 Pro 啟用憑據用）");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(planCode);
    try {
      const res = await fetch("/api/payment/newebpay/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: planCode, email: e }),
      });
      if (!res.ok) {
        alert("建立訂單失敗");
        setSubmitting(null);
        return;
      }
      const { endpoint, params } = await res.json();
      const form = document.createElement("form");
      form.method = "POST";
      form.action = endpoint;
      Object.entries(params as Record<string, string>).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      alert("錯誤：" + (e as Error).message);
      setSubmitting(null);
    }
  }

  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <div className="container" style={{ padding: "56px 32px 24px", textAlign: "center" }}>
          <div
            style={{
              fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em",
              textTransform: "uppercase", marginBottom: 8,
            }}
          >
            解鎖付費
          </div>
          <h1 style={{ fontSize: 44 }}>挑一個適合的方案</h1>
          <p style={{ color: "var(--ink-soft)", marginTop: 12, fontSize: 16, maxWidth: 580, margin: "12px auto 0" }}>
            Free 方案每月可建 <b>3 份</b>合約 — 多數使用者夠用。需要更多請選下列付費方案，皆以
            <b>藍新金流</b>結帳、<b>不自動續約</b>。
          </p>
          <div style={{ maxWidth: 420, margin: "20px auto 0" }}>
            <label style={{ fontSize: 12, color: "var(--ink-muted)", display: "block", textAlign: "left", marginBottom: 4 }}>
              Email（收據 + Pro 帳號識別）
            </label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              style={{ width: "100%" }}
            />
            {emailErr && (
              <div className="field-error" style={{ marginTop: 6, textAlign: "left" }}>
                <Icon name="alert" size={12} />{emailErr}
              </div>
            )}
          </div>
        </div>

        <div className="container dg-checkout-grid" style={{ padding: "36px 32px 56px" }}>
          {PLANS.map((p, i) => (
            <PlanCard
              key={p.code}
              plan={p}
              featured={i === 1}
              onSelect={() => (submitting ? null : pay(p.code))}
            />
          ))}
        </div>

        <div className="container" style={{ padding: "0 32px 32px" }}>
          <div className="card dg-payment-bar" style={{ padding: 22 }}>
            <div>
              <div
                style={{
                  fontSize: 11.5, color: "var(--ink-muted)", letterSpacing: "0.1em",
                  textTransform: "uppercase", marginBottom: 6,
                }}
              >
                付款方式
              </div>
              <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                {["NewebPay", "Visa", "Master", "JCB", "7-11", "全家"].map((p) => (
                  <div
                    key={p}
                    className="row"
                    style={{
                      padding: "6px 12px", borderRadius: 6,
                      background: "var(--bg-soft)", border: "1px solid var(--line)",
                      fontSize: 12, color: "var(--ink-soft)", fontWeight: 500,
                    }}
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>
            <div className="row" style={{ gap: 24, justifyContent: "flex-end", flexWrap: "wrap" }}>
              {[
                { i: "lock", t: "SSL 加密" },
                { i: "shieldCheck", t: "不儲存信用卡資訊" },
                { i: "scale", t: "藍新金流 · 合規收單" },
              ].map((x) => (
                <div key={x.t} className="row gap-2" style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                  <Icon name={x.i} size={13} style={{ color: "var(--primary)" }} />
                  {x.t}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: "0 32px 64px" }}>
          <div
            style={{
              fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em",
              textTransform: "uppercase", marginBottom: 16,
            }}
          >
            常見問題
          </div>
          <div className="dg-faq-grid">
            {[
              ["這些合約具法律效力嗎？", "是的。合約內容均依中華民國法律編製，並透過電子簽章法 §4、§9 保障雙方簽署效力。但重大或複雜爭議仍建議委請律師審閱。"],
              ["Free 方案 3 份用完了怎麼辦？", "等下個月（每月 1 日重置），或現在升級 Pro / Pack 立即解除限制。系統會在你嘗試送出第 4 份合約時擋下並導向升級。"],
              ["會自動續訂嗎？", "不會。Pro 月方案是「付一次給 30 天」，Pack 是「付一次給 90 天」，到期降回 Free，不會繼續扣款。"],
              ["怎麼辨識我是 Pro？", "用 Email 結帳後，系統會把你的瀏覽器（cookie uid）綁定到 PRO，效期內任何裝置只要保持同一個瀏覽器 cookie 就是 Pro。要換裝置請告知客服重綁。"],
              ["合約如何保存？", "簽完的合約 PDF 永久保存於你的後台 /contracts；簽名圖片 + 雜湊 + IP + 時間戳均存證。"],
            ].map(([q, a]) => (
              <div key={q} className="card" style={{ padding: 18 }}>
                <div className="row gap-2" style={{ marginBottom: 6 }}>
                  <Icon name="info" size={14} style={{ color: "var(--primary)" }} />
                  <b style={{ fontSize: 14 }}>{q}</b>
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
