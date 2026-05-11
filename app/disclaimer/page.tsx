import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { LawyerReferralCTA } from "@/components/LawyerReferralCTA";

export const metadata = {
  title: "法律免責 / 律師轉介 · DocGen TW",
  description:
    "DocGen TW 提供文件自動化與風險提示，並非執業律師。涉及訴訟、重大金額或客製條款請委請合作律師。",
};

const FAQ = [
  {
    q: "DocGen TW 是律師事務所嗎？",
    a: "不是。我們提供合約模板、電子簽署、風險提示等「文件自動化」工具，不執行法律業務、不出具法律意見。產出之合約於一般交易具參考效力（依電子簽章法 §4、§9 與紙本簽署同等），但不取代律師審閱。",
  },
  {
    q: "什麼情況下應該找律師，而非只用 DocGen TW？",
    a: "（1）金額 NT$500,000 以上或對營運有重大影響；（2）跨境交易或涉外法律；（3）已有爭議、收到存證信函、面臨訴訟；（4）客製條款、特殊產業（金融、生醫、不動產過戶）；（5）公司股權、併購、智慧財產讓與；（6）刑事相關（恐嚇、詐欺、營業秘密）。",
  },
  {
    q: "風險檢查的紅黃綠燈是什麼？",
    a: "系統依規則比對合約條款，標出常見高風險寫法（如違約金過高、保密期限無限期、單方解除權、利率超過民法 §205 上限）。紅燈代表強烈建議律師審閱；黃燈代表可接受但有議價空間；綠燈代表符合一般市場慣例。本檢查為輔助工具，非法律意見。",
  },
  {
    q: "存證信函草稿與催款通知書，DocGen TW 會代寄嗎？",
    a: "不會。系統僅產出 PDF 草稿，使用者需自行至郵局以「存證信函」掛號寄出（郵局現場有專用紙本格式）。催款通知書同樣只產草稿，使用者可 Email 或郵寄送達相對人。代寄涉及法律業務執行，不在本平台服務範圍。",
  },
  {
    q: "我的合約資料安全嗎？",
    a: "（1）SSL 加密傳輸；（2）簽名圖片以 Vercel Blob 儲存，PDF 嵌入後可下載；（3）簽署留存 IP、時間戳、SHA-256 簽名雜湊作為 audit trail；（4）我們不會將您的合約內容分享給第三方，但可能在去識別化後用於統計與產品改進。",
  },
  {
    q: "如何申請律師轉介？",
    a: "點下方按鈕寄信給我們，描述案情、合約類型、預算與所在縣市。我們將於 1–2 個工作日內媒合 1–2 位合作律師供您直接聯繫，由您與律師議定費用，DocGen TW 不抽取轉介費。",
  },
];

export default function DisclaimerPage() {
  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "48px 32px 24px", maxWidth: 860 }}>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            <Icon name="scale" size={13} />
            法律定位
          </div>
          <h1 style={{ fontSize: 44, marginBottom: 18 }}>
            文件自動化 · 風險提示 ·
            <br />
            <span style={{ fontFamily: "var(--font-italic)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>
              律師轉介
            </span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--ink-soft)" }}>
            DocGen TW 是<b>合約 SaaS 工具</b>，不是律師事務所。我們做三件事：
          </p>
          <ol style={{ fontSize: 15, lineHeight: 1.85, color: "var(--ink)", paddingLeft: 22, marginTop: 12 }}>
            <li><b>文件自動化</b>：8 種範本 + 動態表單 + 即時 PDF + 雙方簽署。</li>
            <li><b>風險提示</b>：規則式紅黃綠燈標示常見高風險條款，告訴你「為什麼」與「對應法條」。</li>
            <li><b>律師轉介</b>：偵測到複雜情境（紅燈、跨境、訴訟）時，推薦合作律師。律師費由您與律師議定，平台不抽成。</li>
          </ol>
        </section>

        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 860 }}>
          <div className="card" style={{
            padding: 22, background: "var(--amber-50)", border: "1px solid #f0d9a4",
            borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div className="row gap-2" style={{ alignItems: "center" }}>
              <Icon name="fileWarn" size={16} style={{ color: "var(--amber-600)" }} />
              <b style={{ color: "#5b3f10" }}>我們不做這些事</b>
            </div>
            <ul style={{ fontSize: 14, lineHeight: 1.8, color: "#7a5a2a", paddingLeft: 20, margin: 0 }}>
              <li>不提供針對個案的法律意見或訴訟策略。</li>
              <li>不代理出庭、不代撰書狀、不代寄存證信函至郵局。</li>
              <li>不擔保合約於特定案件之法律效力或勝訴可能。</li>
              <li>不審查違反強行法、公序良俗或詐害第三人之合約。</li>
            </ul>
          </div>
        </section>

        <section className="container" style={{ padding: "24px 32px 24px", maxWidth: 860 }}>
          <h2 style={{ fontSize: 28, marginBottom: 20 }}>常見問題</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FAQ.map((f, i) => (
              <details key={i} className="card" style={{ padding: 18, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
                <summary style={{ fontWeight: 600, fontSize: 15, cursor: "pointer", listStyle: "none" }}>{f.q}</summary>
                <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.75, color: "var(--ink-soft)" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="container" style={{ padding: "24px 32px 64px", maxWidth: 860 }}>
          <LawyerReferralCTA variant="card" context="一般法律諮詢" />
          <div style={{ marginTop: 20, fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.7 }}>
            最後更新：2026 年。如本頁與您簽署的服務條款衝突，以服務條款為準。
            <br />
            DocGen TW 為 <Link href="/" style={{ textDecoration: "underline" }}>合約自動化平台</Link>，非執業律師、非法律事務所。
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
