"use client";
import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { PlanCard, type Plan } from "@/components/PlanCard";

const PLANS: Plan[] = [
  {
    code: "single", tag: "Single", name: "單份合約",
    tagline: "臨時急用、一次性合作",
    price: "99", unit: "份", cta: "立即購買",
    features: ["1 份合約自動產生", "所有 8 種範本", "法條引用 + 法律依據", "PDF 永久下載", "雙方電子簽署存證"],
  },
  {
    code: "pack", tag: "Pack", name: "範本包",
    tagline: "小公司常用組合",
    price: "499", unit: "一次性", cta: "購買範本包",
    features: ["10 份合約額度", "全部範本 + 進階條款", "客製化條款 AI 建議", "優先 Email 客服", "雜湊存證 + 區塊鏈時間戳"],
  },
  {
    code: "pro", tag: "Pro", name: "Pro 訂閱",
    tagline: "頻繁使用者、新創、自由工作者",
    price: "299", unit: "月", cta: "開始 7 日試用",
    features: ["無限合約產生", "團隊共享 5 席", "API 串接", "專屬律師審閱（每月 1 份）", "客製模板 + 公司用印", "自動續約管理"],
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
          <p style={{ color: "var(--ink-soft)", marginTop: 12, fontSize: 16, maxWidth: 540, margin: "12px auto 0" }}>
            所有方案都包含完整法條引用與電子簽章存證。新創常見組合是「先買單份、頻繁使用後升級 Pro」。
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
                { i: "rotateCcw", t: "7 天無條件退款" },
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
              ["這些合約具法律效力嗎？", "是的。合約內容均依中華民國法律編製，並透過電子簽章法 §4、§9 保障雙方簽署效力。但重大或複雜爭議仍建議委請律師。"],
              ["可以客製條款嗎？", "Pack 與 Pro 方案支援自訂條款。系統 AI 會即時提示對應的法條依據。"],
              ["退款政策？", "購買後 7 天內如未使用任何合約，皆可申請全額退款。"],
              ["合約如何保存？", "PDF 與簽署存證資訊永久保存於你的帳戶。Pro 方案另支援匯出至 Google Drive / Dropbox。"],
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
