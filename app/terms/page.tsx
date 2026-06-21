import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "服務條款 · DocGen TW",
  description:
    "DocGen TW 服務條款：服務內容、付款與金流（藍新 NewebPay）、退款、智慧財產、免責與責任限制、準據法等使用者權利義務說明。",
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "適用範圍與定義",
    body: (
      <>
        <p>
          本服務條款（下稱「本條款」）適用於您使用 DocGen TW 網站及其相關服務（下稱「本服務」）。本服務由
          {COMPANY.legalName}（下稱「本公司」）營運。您註冊、瀏覽或使用本服務，即表示您已閱讀、瞭解並同意本條款全部內容。
        </p>
        <p>
          本服務指本公司提供之台灣法律文件自動產生、合約風險提示、雙方電子簽署與相關加值功能。
        </p>
      </>
    ),
  },
  {
    title: "帳號與使用者責任",
    body: (
      <>
        <p>
          使用部分功能須提供 Email 作為帳號識別。您應確保所提供之資料正確且為本人所有，並妥善保管帳號之存取權限（含瀏覽器
          cookie 與簽署連結）。因您自行洩漏或交付他人使用所生之損害，由您自行負責。
        </p>
      </>
    ),
  },
  {
    title: "服務內容與變更",
    body: (
      <>
        <p>
          本服務提供合約範本、動態表單、PDF 產出、電子簽署、風險提示等功能。本公司得視營運需要新增、調整或停止部分功能；如有重大變更，將於網站公告。免費方案之額度（如每月可建立之合約份數）以站內即時顯示為準。
        </p>
      </>
    ),
  },
  {
    title: "付款與金流",
    body: (
      <>
        <p>
          付費方案（如單份解鎖、Pro、90 日方案）之價格以<b>站內定價頁即時顯示之金額</b>為準，幣別為新臺幣（含稅）。付款透過第三方支付服務商
          <b>藍新金流（NewebPay）</b>處理，本公司不經手亦不儲存您的信用卡完整資訊。
        </p>
        <p>
          除站內另有標示外，付費方案均為<b>一次性付款</b>（付一次給一段效期），不自動續約、不自動扣款；效期屆滿後降回免費方案。
        </p>
      </>
    ),
  },
  {
    title: "退款政策",
    body: (
      <p>
        退款條件、申請管道與處理時程，詳見
        <Link href="/refund" style={{ textDecoration: "underline", margin: "0 2px" }}>退款政策</Link>
        ，該政策為本條款之一部分。
      </p>
    ),
  },
  {
    title: "智慧財產權",
    body: (
      <>
        <p>
          本服務之網站介面、程式、範本架構、商標與文案，其智慧財產權均屬本公司或其授權人所有，非經書面同意不得重製、改作或散布。
        </p>
        <p>
          您填入表單之內容與據此產出之合約文件，權利歸您所有；您並授權本公司於提供服務之必要範圍內儲存與處理該等內容。
        </p>
      </>
    ),
  },
  {
    title: "禁止行為",
    body: (
      <ul style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <li>以本服務產出違反強行法規、公序良俗或詐害第三人之文件。</li>
        <li>冒用他人名義註冊、簽署或偽造簽名。</li>
        <li>對本服務進行未經授權之爬取、逆向工程、攻擊或干擾。</li>
        <li>轉售、出租本服務或將付費額度提供予第三人營利使用。</li>
        <li>其他違反本條款或法令之行為。違反者本公司得暫停或終止您之使用權。</li>
      </ul>
    ),
  },
  {
    title: "個人資料保護",
    body: (
      <p>
        本公司如何蒐集、處理及利用您的個人資料，詳見
        <Link href="/privacy" style={{ textDecoration: "underline", margin: "0 2px" }}>隱私權政策</Link>
        ，該政策為本條款之一部分。
      </p>
    ),
  },
  {
    title: "文件性質與數位簽約效力",
    body: (
      <>
        <p>
          本服務產出之合約文件與風險提示，係依一般情形編製之<b>自動化文件工具</b>，僅供參考，
          <b>不構成法律意見</b>，本公司亦非律師事務所、不執行法律業務。涉及訴訟、重大金額或客製條款，請委請律師審閱，詳見
          <Link href="/disclaimer" style={{ textDecoration: "underline", margin: "0 2px" }}>法律免責聲明</Link>。
        </p>
        <p>
          透過本服務完成之電子簽署，依電子簽章法相關規定，於依法得使用電子文件與電子簽章之事項，經雙方同意以電子方式為之者，與書面及親自簽名具有同等效力；簽署過程留存
          IP、時間戳與簽名雜湊以供存證。惟法令明定應以書面、公證或其他特定方式為之者（如部分不動產、身分行為），不適用之。
        </p>
      </>
    ),
  },
  {
    title: "免責聲明與責任限制",
    body: (
      <>
        <p>
          本服務依「現狀」提供。本公司不擔保本服務不中斷、無錯誤，亦不擔保產出文件於特定個案之法律效果。因不可抗力、第三方服務（含金流、雲端基礎設施）中斷所生之損害，本公司不負賠償責任。
        </p>
        <p>
          於法令許可之最大範圍內，本公司就您因使用本服務所生之損害，賠償總額以<b>您就該筆爭議交易實際支付予本公司之金額</b>為上限；本公司對間接損害、所失利益不負責任。但本公司因故意或重大過失所致者，不在此限。
        </p>
      </>
    ),
  },
  {
    title: "服務終止",
    body: (
      <p>
        您得隨時停止使用本服務。您違反本條款時，本公司得暫停或終止您之使用權，且就已使用之付費服務不予退款。本公司終止全部服務時，將於合理期間前公告，並依退款政策處理未使用之付費權益。
      </p>
    ),
  },
  {
    title: "準據法與管轄",
    body: (
      <p>
        本條款之解釋與適用，以<b>中華民國法律</b>為準據法。因本條款所生之爭議，雙方同意以本公司所在地之地方法院為第一審管轄法院；但消費者保護法等法令另有規定者，從其規定。
      </p>
    ),
  },
  {
    title: "聯絡方式",
    body: (
      <p>
        營運者：{COMPANY.name}｜統一編號：{COMPANY.taxId}｜地址：{COMPANY.address}
        <br />
        客服 Email：{COMPANY.email}｜LINE：{COMPANY.lineId}
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "48px 32px 16px", maxWidth: 860 }}>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            <Icon name="scale" size={13} />
            法律文件
          </div>
          <h1 style={{ fontSize: 44, marginBottom: 14 }}>
            服務
            <span style={{ fontFamily: "var(--font-italic)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>
              條款
            </span>
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--ink-soft)" }}>
            本頁說明您使用 DocGen TW 的權利與義務。請於使用本服務前詳細閱讀；另請參閱
            <Link href="/privacy" style={{ textDecoration: "underline", margin: "0 2px" }}>隱私權政策</Link>與
            <Link href="/refund" style={{ textDecoration: "underline", margin: "0 2px" }}>退款政策</Link>。
          </p>
        </section>

        <section className="container" style={{ padding: "16px 32px 64px", maxWidth: 860, display: "flex", flexDirection: "column", gap: 14 }}>
          {SECTIONS.map((s, i) => (
            <div key={i} className="card" style={{ padding: "20px 22px", background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
              <h2 style={{ fontSize: 17, marginBottom: 10 }}>
                第 {i + 1} 條　{s.title}
              </h2>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink-soft)", display: "flex", flexDirection: "column", gap: 8 }}>
                {s.body}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.7 }}>
            最後更新：2026 年 6 月。本公司得隨時修訂本條款，修訂後於本頁公告即生效力；重大變更將另行於網站顯著處公告。
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
