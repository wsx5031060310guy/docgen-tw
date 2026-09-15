"use client";

import { useRef, useState } from "react";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { PlanCard, type Plan } from "@/components/PlanCard";
import { TopNav } from "@/components/TopNav";

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

const PAYMENT_METHODS = ["NewebPay", "Visa", "Master", "JCB", "7-11", "全家"];
const TRUST_ITEMS = [
  { icon: "lock", text: "SSL 加密" },
  { icon: "shieldCheck", text: "不儲存信用卡資訊" },
  { icon: "scale", text: "藍新金流 · 合規收單" },
];
const FAQS = [
  ["這些合約具法律效力嗎？", "是的。合約內容均依中華民國法律編製，並透過電子簽章法 §4、§9 保障雙方簽署效力。但重大或複雜爭議仍建議委請律師審閱。"],
  ["Free 方案 3 份用完了怎麼辦？", "等下個月（每月 1 日重置），或現在升級 Pro / Pack 立即解除限制。系統會在你嘗試送出第 4 份合約時擋下並導向升級。"],
  ["會自動續訂嗎？", "不會。Pro 月方案是「付一次給 30 天」，Pack 是「付一次給 90 天」，到期降回 Free，不會繼續扣款。"],
  ["怎麼辨識我是 Pro？", "用 Email 結帳後，系統會把你的瀏覽器（cookie uid）綁定到 PRO，效期內任何裝置只要保持同一個瀏覽器 cookie 就是 Pro。要換裝置請告知客服重綁。"],
  ["合約如何保存？", "簽完的合約 PDF 永久保存於你的後台 /contracts；簽名圖片 + 雜湊 + IP + 時間戳均存證。"],
];

export default function CheckoutPage() {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const submissionLocked = useRef(false);

  async function pay(planCode: string) {
    if (submissionLocked.current) return;
    setEmailError(null);
    setOrderError(null);
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      setEmailError("請先輸入有效 Email（付款收據與 Pro 啟用憑據用）");
      emailRef.current?.focus();
      return;
    }

    submissionLocked.current = true;
    setSubmitting(planCode);
    try {
      const response = await fetch("/api/payment/newebpay/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: planCode, email: normalizedEmail }),
      });
      const result = await response.json().catch(() => null) as {
        endpoint?: string;
        params?: Record<string, string>;
        error?: string;
      } | null;
      if (!response.ok) throw new Error(result?.error || `HTTP ${response.status}`);
      if (!result?.endpoint || !result.params) throw new Error("付款閘道資料不完整");

      const form = document.createElement("form");
      form.method = "POST";
      form.action = result.endpoint;
      Object.entries(result.params).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      setOrderError(`建立訂單失敗：${(error as Error).message}`);
      submissionLocked.current = false;
      setSubmitting(null);
    }
  }

  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <div className="dg-page-shell dg-checkout-page">
          <header className="dg-checkout-header">
            <div className="dg-eyebrow">解鎖付費</div>
            <h1 className="dg-page-title">挑一個適合的方案</h1>
            <p className="dg-body dg-checkout-intro">
              Free 方案每月可建 <strong>3 份</strong>合約。需要更多時可選擇下列付費方案，皆以
              <strong>藍新金流</strong>結帳、<strong>不自動續約</strong>。
            </p>
            <div className="field dg-checkout-email-field">
              <label className="field-label" htmlFor="checkout-email">Email（收據與 Pro 帳號識別）</label>
              <input
                ref={emailRef}
                id="checkout-email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-describedby={`checkout-email-help${emailError ? " checkout-email-error" : ""}`}
                aria-invalid={Boolean(emailError) || undefined}
              />
              <p id="checkout-email-help" className="field-help">付款收據與 Pro 啟用憑據會寄送至此 Email。</p>
              {emailError && (
                <div id="checkout-email-error" className="field-error" role="alert">
                  <Icon name="alert" size={12} />{emailError}
                </div>
              )}
            </div>
          </header>

          <section className="dg-section dg-checkout-plans" aria-labelledby="checkout-plans-title">
            <h2 id="checkout-plans-title" className="dg-section-title">選擇付費方案</h2>
            {orderError && (
              <div className="dg-notice dg-notice--error dg-checkout-error" role="alert">
                <Icon name="alertOctagon" size={14} />
                <span>{orderError}。請稍後再試，尚未送往付款頁。</span>
              </div>
            )}
            <div className="dg-checkout-grid">
              {PLANS.map((plan, index) => (
                <PlanCard
                  key={plan.code}
                  plan={plan}
                  featured={index === 1}
                  busy={submitting === plan.code}
                  disabled={submitting !== null && submitting !== plan.code}
                  onSelect={() => void pay(plan.code)}
                />
              ))}
            </div>
          </section>

          <section className="card dg-card-body dg-payment-bar dg-checkout-payment" aria-labelledby="checkout-payment-title">
            <div>
              <h2 id="checkout-payment-title" className="dg-subsection-title">付款方式</h2>
              <ul className="dg-checkout-payment-methods" aria-label="支援付款方式">
                {PAYMENT_METHODS.map((method) => <li key={method}>{method}</li>)}
              </ul>
            </div>
            <ul className="dg-checkout-trust" aria-label="付款安全說明">
              {TRUST_ITEMS.map((item) => (
                <li key={item.text}><Icon name={item.icon} size={13} />{item.text}</li>
              ))}
            </ul>
          </section>

          <section className="dg-section dg-checkout-faq" aria-labelledby="checkout-faq-title">
            <h2 id="checkout-faq-title" className="dg-section-title">常見問題</h2>
            <div className="dg-faq-grid">
              {FAQS.map(([question, answer]) => (
                <article key={question} className="card dg-card-body dg-checkout-faq-card">
                  <div className="dg-checkout-faq-heading">
                    <Icon name="info" size={14} />
                    <h3 className="dg-subsection-title">{question}</h3>
                  </div>
                  <p className="dg-text-secondary">{answer}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
        <Footer />
      </main>
    </>
  );
}
