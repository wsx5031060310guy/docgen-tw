import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "退款政策 · DocGen TW",
  description:
    "DocGen TW 退款政策：數位內容與線上服務之 7 天猶豫期例外說明（消保法 §19）、未使用前申請退款之條件、申請管道、處理時程與爭議處理。",
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "服務性質與 7 天猶豫期之例外",
    body: (
      <>
        <p>
          本服務之付費方案（單份合約解鎖、Pro、90 日方案）屬<b>非以有形媒介提供之數位內容及一經提供即為完成之線上服務</b>。依消費者保護法第
          19 條第 1 項但書，及「通訊交易解除權合理例外情事適用準則」第 2 條第 5
          款，此類商品經消費者事先同意始提供者，<b>排除 7 天猶豫期（無條件解除權）之適用</b>。
        </p>
        <p>
          您於結帳付款前勾選同意（或點擊付款即視為同意）本政策後，方案權益即時開通並開始提供，故付款完成且<b>已開始使用</b>後，原則上不接受無條件退款。但本政策第
          2 條之情形不在此限。
        </p>
      </>
    ),
  },
  {
    title: "可申請退款之情形",
    body: (
      <>
        <p>符合下列任一情形者，您得申請退款：</p>
        <ul style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <li>
            <b>付款後尚未使用</b>：付款完成後尚未使用任何付費權益（未解鎖下載任何合約、未使用任何付費功能），得於付款日起
            7 日內申請全額退款。
          </li>
          <li><b>重複扣款或金額錯誤</b>：因系統或金流異常造成重複扣款、溢收金額，就重複或溢收部分全額退款。</li>
          <li><b>服務無法提供</b>：因可歸責於本公司之事由，致已付費之服務於合理期間內無法開通或持續無法使用。</li>
          <li>其他依消費者保護法等法令您得主張之情形。</li>
        </ul>
        <p>
          已實際使用付費權益（如已解鎖下載合約、已於效期內使用 Pro 功能）者，該部分對價不予退還；期間方案於使用後申請終止者，本公司得按未使用比例與實際情形個案協商退款金額。
        </p>
      </>
    ),
  },
  {
    title: "申請管道",
    body: (
      <p>
        請以 Email 寄至 <b>{COMPANY.email}</b>（標題註明「退款申請」），並提供：訂單編號（或付款
        Email 與付款時間）、付款方案、申請原因。亦可透過 LINE 官方帳號 {COMPANY.lineId} 聯繫客服。
      </p>
    ),
  },
  {
    title: "處理時程與退款方式",
    body: (
      <ul style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <li>本公司於收到申請後 <b>3 個工作天內</b>回覆受理結果。</li>
        <li>
          核准退款者，於核准日起 <b>14 個工作天內</b>依原付款方式退回：信用卡付款採<b>原卡退刷</b>；超商代碼等非信用卡付款，將與您確認退款帳戶後匯款退回。
        </li>
        <li>退款入帳時間依發卡銀行或金融機構作業為準。退款完成後，對應之付費權益即時終止。</li>
      </ul>
    ),
  },
  {
    title: "爭議處理",
    body: (
      <p>
        如您對退款結果有異議，可再次來信由本公司複核；亦得依消費者保護法向直轄市、縣（市）政府消費者服務中心或消費者保護官申訴，或向法院提起訴訟。相關爭議之準據法與管轄，依
        <Link href="/terms" style={{ textDecoration: "underline", margin: "0 2px" }}>服務條款</Link>之約定。
      </p>
    ),
  },
];

export default function RefundPage() {
  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "48px 32px 16px", maxWidth: 860 }}>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            <Icon name="shieldCheck" size={13} />
            法律文件
          </div>
          <h1 style={{ fontSize: 44, marginBottom: 14 }}>
            退款
            <span style={{ fontFamily: "var(--font-italic)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>
              政策
            </span>
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--ink-soft)" }}>
            本服務為數位內容／線上服務，付費方案均為一次性付款、不自動續約。本頁說明退款條件、申請管道與處理時程；其餘權利義務見
            <Link href="/terms" style={{ textDecoration: "underline", margin: "0 2px" }}>服務條款</Link>。
          </p>
        </section>

        <section className="container" style={{ padding: "16px 32px 64px", maxWidth: 860, display: "flex", flexDirection: "column", gap: 14 }}>
          {SECTIONS.map((s, i) => (
            <div key={i} className="card" style={{ padding: "20px 22px", background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
              <h2 style={{ fontSize: 17, marginBottom: 10 }}>
                {i + 1}. {s.title}
              </h2>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink-soft)", display: "flex", flexDirection: "column", gap: 8 }}>
                {s.body}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.7 }}>
            最後更新：2026 年 6 月。
            <br />
            營運者：{COMPANY.name}｜客服 Email：{COMPANY.email}｜電話：{COMPANY.phone}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
