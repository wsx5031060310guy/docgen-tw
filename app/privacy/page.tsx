import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "隱私權政策 · DocGen TW",
  description:
    "DocGen TW 隱私權政策：依個人資料保護法第 8 條告知蒐集目的、個資類別、利用期間地區對象方式、當事人權利行使管道、Cookie 與安全維護措施。",
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "蒐集個人資料之公司",
    body: (
      <p>
        本隱私權政策由{COMPANY.legalName}（下稱「本公司」）訂定。本公司為 DocGen TW
        服務之個人資料蒐集者，依個人資料保護法（下稱「個資法」）第 8 條向您告知下列事項。
      </p>
    ),
  },
  {
    title: "蒐集之目的",
    body: (
      <ul style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <li>提供合約文件產生、電子簽署、風險提示等服務（契約或類似契約關係之事務）。</li>
        <li>會員與帳號管理、客戶服務與爭議處理。</li>
        <li>收費、開立憑證與金流交易處理。</li>
        <li>服務通知（如簽署完成、到期提醒）之寄送。</li>
        <li>去識別化後之統計分析與服務改善。</li>
      </ul>
    ),
  },
  {
    title: "蒐集之個人資料類別",
    body: (
      <ul style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <li><b>帳號資料</b>：Email、瀏覽器識別（cookie uid）。</li>
        <li><b>文件內容</b>：您於表單填入之合約內容，可能包含您與合約相對人之姓名、地址、電話、統一編號、銀行帳號等當事人資料。</li>
        <li><b>簽署存證資料</b>：簽名圖像、簽署時之 IP 位址、時間戳與文件雜湊。</li>
        <li><b>交易紀錄</b>：訂單編號、方案、金額、付款狀態（信用卡完整卡號由金流服務商處理，本公司不儲存）。</li>
      </ul>
    ),
  },
  {
    title: "利用期間、地區、對象及方式",
    body: (
      <>
        <p>
          <b>期間</b>：自蒐集時起至蒐集目的消失（如帳號刪除、文件刪除）或法令要求保存期限屆滿為止。
        </p>
        <p>
          <b>地區</b>：中華民國境內，及本公司所使用雲端基礎設施伺服器之所在地。
        </p>
        <p>
          <b>對象與方式</b>：由本公司於上述目的範圍內以自動化系統處理及利用，並於必要範圍內提供予下列協力廠商：
        </p>
        <ul style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <li>金流服務商（藍新金流 NewebPay）：處理付款與交易驗證。</li>
          <li>雲端基礎設施與資料庫服務商：網站運行、資料儲存與備援。</li>
          <li>Email 寄送服務商：寄送簽署連結、收據與服務通知。</li>
          <li>依法令、主管機關或法院要求提供者。</li>
        </ul>
        <p>除上述情形外，本公司不會將您的個人資料或合約內容出售或提供予第三人。</p>
      </>
    ),
  },
  {
    title: "您依個資法第 3 條得行使之權利",
    body: (
      <>
        <ul style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <li>查詢或請求閱覽您的個人資料。</li>
          <li>請求製給複製本。</li>
          <li>請求補充或更正。</li>
          <li>請求停止蒐集、處理或利用。</li>
          <li>請求刪除。</li>
        </ul>
        <p>
          行使方式：請以 Email 聯絡 {COMPANY.email}，本公司將於收到請求後依個資法規定期限處理。如您請求停止利用或刪除與服務提供必要相關之資料，部分功能可能因此無法繼續提供。
        </p>
      </>
    ),
  },
  {
    title: "Cookie 之使用",
    body: (
      <p>
        本服務使用 cookie 以維持登入狀態、記住語系偏好與識別付費方案（cookie
        uid）。您可於瀏覽器設定中拒絕或刪除 cookie，惟部分功能（如 Pro 權益識別）可能因此無法正常運作。本服務不使用 cookie 進行跨站追蹤廣告。
      </p>
    ),
  },
  {
    title: "個人資料之安全維護",
    body: (
      <ul style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <li>全站 SSL/TLS 加密傳輸。</li>
        <li>簽署存證採 SHA-256 雜湊，防止文件遭竄改。</li>
        <li>資料庫存取權限控管，僅限提供服務必要之人員與系統存取。</li>
        <li>信用卡資訊由通過 PCI-DSS 認證之金流服務商處理，本公司不接觸完整卡號。</li>
      </ul>
    ),
  },
  {
    title: "政策修訂與公告",
    body: (
      <p>
        本公司得因法令或服務調整修訂本政策，修訂後將公告於本頁並更新「最後更新」日期；重大變更將於網站顯著處公告。建議您定期查閱。
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "48px 32px 16px", maxWidth: 860 }}>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            <Icon name="lock" size={13} />
            法律文件
          </div>
          <h1 style={{ fontSize: 44, marginBottom: 14 }}>
            隱私權
            <span style={{ fontFamily: "var(--font-italic)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>
              政策
            </span>
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--ink-soft)" }}>
            您的合約內容含有當事人個人資料，我們依個人資料保護法處理並以最小必要原則利用。本頁為個資法第 8 條之告知事項；使用者權利義務另見
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
            聯絡方式：{COMPANY.name}｜{COMPANY.email}｜{COMPANY.address}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
