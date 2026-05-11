import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { JsonLd } from "@/components/JsonLd";
import { TEMPLATES, getTemplate } from "@/lib/templates";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://docgen-tw.vercel.app";

// Static SEO landing pages — one per contract template.
// Pre-rendered, indexable, with rich content (FAQ, legal basis explanations,
// who-should-use, common-pitfalls) targeting Taiwan-specific search intent.
export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ id: t.id }));
}

const COPY: Record<
  string,
  {
    intent: string;
    useCases: string[];
    pitfalls: string[];
    keyClauses: { name: string; why: string; ref: string }[];
    faqs: { q: string; a: string }[];
  }
> = {
  freelance: {
    intent: "適合接案設計師、自由開發者、文案、顧問與小型工作室與客戶之間，明定交付物、報酬、智慧財產權歸屬與逾期違約金的書面契約。",
    useCases: [
      "品牌識別 / Logo / UI 設計案",
      "網站、APP 客製開發專案",
      "影片拍攝、攝影、剪輯接案",
      "顧問諮詢、企劃撰寫、行銷外包",
    ],
    pitfalls: [
      "未明定 IP 歸屬 → 客戶以為買斷、乙方以為授權",
      "違約金 > 0.5%/日 → 法院依民法 §252 酌減",
      "未約定驗收期限 → 完工 / 驗收爭議冗長",
      "口頭加項目未補書面 → 結案時無法追加報酬",
    ],
    keyClauses: [
      { name: "工作範圍", why: "明列交付物、規格、修改次數，避免無止盡改稿", ref: "民法 §490" },
      { name: "報酬與付款", why: "建議分期：簽約 30% / 期中 30% / 驗收 40%", ref: "民法 §505" },
      { name: "智慧財產權", why: "明定 a/b/共有 三種模式，避免日後紛爭", ref: "著作權法 §12" },
      { name: "逾期違約金", why: "0.1%–0.3%/日 + 總額 20% 上限為市場慣例", ref: "民法 §250、§252" },
    ],
    faqs: [
      { q: "報酬可以全部完工後一次付嗎？", a: "可以，但若工期長於 1 個月，分期付款對乙方較有保障；對甲方則建議在驗收後再付尾款（30–40%）。" },
      { q: "客戶不付尾款怎麼辦？", a: "依本合約已留存簽署時間戳與簽名雜湊，可直接作為民事訴訟證據。實務上先寄存證信函（DocGen TW 也可產草稿）→ 申請支付命令 → 必要時起訴。" },
      { q: "智慧財產權選共有，雙方都能用嗎？", a: "可以，但任一方對外授權第三人前須徵得他方書面同意（民法第 819 條）。" },
    ],
  },
  nda: {
    intent: "雙方在商業合作、技術評估、客戶名單分享前，互負保密義務的協議，保護營業秘密與機密資訊不流向第三方。",
    useCases: [
      "技術授權前的洽談階段",
      "投資人盡職調查（DD）",
      "顧問、外包人員存取內部系統前",
      "合資、併購前的商業計畫互換",
    ],
    pitfalls: [
      "保密期間 = 永久 / 無限期 → 法院常認違反比例原則",
      "違約金金額過高（NT$10M 以上）→ 法院酌減",
      "未排除「已合法知悉」「公開資訊」「依法揭露」三例外 → 條款過寬難執行",
      "未約定救濟方式（禁令 / 損害賠償）→ 違約後求償困難",
    ],
    keyClauses: [
      { name: "機密資訊定義", why: "限縮在符合營業秘密法 §2 要件之資訊", ref: "營業秘密法 §2" },
      { name: "保密義務", why: "受領方須以善良管理人注意義務保管", ref: "民法 §535" },
      { name: "保密期間", why: "建議 3–5 年；技術 know-how 可至 10 年", ref: "民法 §247-1" },
      { name: "違約責任", why: "明列懲罰性違約金 + 損害賠償", ref: "民法 §227、§250" },
    ],
    faqs: [
      { q: "NDA 要單方還是雙方互負？", a: "若雙方都會揭露機密，必須是雙方互負（mutual NDA）；單方 NDA 僅在一方揭露時使用。" },
      { q: "離職員工的 NDA 有效嗎？", a: "在職期間絕對有效；離職後僅在符合營業秘密法且未違反比例原則時有效。離職後競業禁止另須依勞基法 §9-1 約定合理代償。" },
    ],
  },
  loan: {
    intent: "個人或公司間之金錢借貸契約，明訂金額、利率、還款期限與違約處理，受民法第 205 條年息 16% 上限約束。",
    useCases: [
      "親友間之借款（建議仍訂書面）",
      "公司股東墊款 / 法定代理人借款",
      "中小企業短期週轉",
      "代墊款項之還款協議",
    ],
    pitfalls: [
      "年利率約定 > 16% → 超過部分無請求權（§205）",
      "利息預扣 / 預先扣繳 → 民法 §206 禁止",
      "未約定還款日 → 視為定期型，得隨時請求（§478）",
      "未交付（僅口頭）→ 消費借貸尚未成立（§474）",
    ],
    keyClauses: [
      { name: "借款金額與交付", why: "借款須實際交付才成立，非僅約定", ref: "民法 §474" },
      { name: "利率", why: "年息不得逾 16%，建議列明計算公式", ref: "民法 §205、§206" },
      { name: "還款方式", why: "明列分期金額、還款日、寬限期", ref: "民法 §478" },
      { name: "違約處理", why: "逾期 N 日視為全部到期，可聲請強制執行", ref: "民法 §250、§253" },
    ],
    faqs: [
      { q: "親友借錢還要訂契約嗎？", a: "強烈建議。即便信任對方，書面合約是日後追討的唯一證據。本合約已合規 §205 利率上限，可直接使用。" },
      { q: "借款被賴帳如何追討？", a: "本合約搭配電子簽署的簽名雜湊、IP、時間戳可作為訴訟證據。流程：存證信函 → 支付命令 → 民事訴訟 → 強制執行。" },
    ],
  },
  consign: {
    intent: "委由他人處理特定事務（代辦、代理、財產管理）之契約，受任人負善良管理人注意義務。",
    useCases: ["代辦公司登記 / 報稅", "財產管理 / 收租代收", "代買代售商品", "業務代理"],
    pitfalls: [
      "未明列事務範圍 → 受任人權限過大或不足",
      "未約定報酬支付時點 → 結案後爭議",
      "終止後未交還資料 → 形成新糾紛",
      "代理對外行為之風險未明確分擔",
    ],
    keyClauses: [
      { name: "委任事務", why: "具體列舉，避免空泛", ref: "民法 §528" },
      { name: "注意義務", why: "有償者負善良管理人注意（§535）", ref: "民法 §535" },
      { name: "報酬與終止", why: "雙方得隨時終止，但於不利時期應賠償", ref: "民法 §547、§549" },
    ],
    faqs: [
      { q: "委任跟承攬有什麼不同？", a: "委任以「處理事務」為標的，重在過程；承攬以「完成一定工作」為標的，重在結果。寫錯適用法條會影響爭議解決。" },
    ],
  },
  employ: {
    intent: "雇主與勞工之勞動契約，受勞動基準法強制規定約束，工資不得低於基本工資、工時不得逾 8 小時。",
    useCases: ["全職正職員工", "兼職 / 工讀生", "外籍員工", "試用期員工"],
    pitfalls: [
      "薪資低於基本工資 → 約定無效",
      "工時 > 8 小時未約定加班費 → 違反勞基法 §32",
      "離職後競業禁止無代償 → 條款無效（勞基法 §9-1）",
      "試用期長於 3 個月 → 不利證明不適任",
    ],
    keyClauses: [
      { name: "契約性質", why: "不定期 vs 定期契約適用條件不同", ref: "勞基法 §9" },
      { name: "工時", why: "每日 8 小時、每週 40 小時為上限", ref: "勞基法 §30" },
      { name: "工資", why: "不得低於行政院公告之基本工資", ref: "勞基法 §21、§22" },
    ],
    faqs: [
      { q: "可以約定試用期嗎？", a: "可以，但勞基法無「試用期」明文，建議不超過 3 個月，且試用期間之資遣仍須符合勞基法 §11 規定。" },
    ],
  },
  lease: {
    intent: "房屋或土地之租賃契約，明訂租金、押金、修繕分擔與提前終止條款。",
    useCases: ["居住用住宅租賃", "辦公室 / 店面承租", "倉儲空間", "短期租用"],
    pitfalls: [
      "押金 > 2 個月租金 → 違反土地法 §99（住宅）",
      "未明定修繕分擔 → 漏水冷氣壞誰修",
      "未約定提前終止違約 → 一方走人另一方求償困難",
      "未拍照存證標的狀態 → 押金返還爭議",
    ],
    keyClauses: [
      { name: "租賃標的", why: "地址、坪數、附屬設備清單", ref: "民法 §421" },
      { name: "租金與押金", why: "押金不逾 2 月、無息返還", ref: "民法 §439、土地法 §99" },
      { name: "修繕", why: "原則出租人負擔，承租人不得拒絕修繕", ref: "民法 §429" },
    ],
    faqs: [
      { q: "房客不繳房租可以直接斷水斷電嗎？", a: "不行。除有契約特別約定且符合比例原則外，斷水斷電可能構成刑事妨害自由。應依法定程序：催告 → 解約 → 訴請遷讓。" },
    ],
  },
  sale: {
    intent: "動產或不動產之買賣契約，明訂標的物、價金、交付方式與瑕疵擔保責任。",
    useCases: ["二手車買賣", "公司資產出售", "藝術品 / 古董", "電子產品交易"],
    pitfalls: [
      "未約定瑕疵發現期間 → 訴爭擴大",
      "未明列檢驗方式 → 買方主張全額退費",
      "價金未約定支付時點 → 收款風險",
    ],
    keyClauses: [
      { name: "瑕疵擔保", why: "出賣人擔保物無滅失瑕疵", ref: "民法 §354" },
      { name: "交付", why: "明定地點、方式、運費負擔", ref: "民法 §348" },
    ],
    faqs: [
      { q: "瑕疵擔保期是多久？", a: "民法 §365：買受人應在 6 個月內通知，且不得逾 5 年。商業交易常縮短為 30–90 日。" },
    ],
  },
  dunning: {
    intent: "對逾期未付款之相對人發出之催告通知書（民法第 229 條給付遲延），保留法定遲延利息與訴訟權利。",
    useCases: ["承攬報酬逾期未付", "借款利息或本金逾期", "貨款未收", "服務費長期積欠"],
    pitfalls: [
      "未給寬限期直接訴訟 → 部分情形喪失程序利益",
      "金額計算錯誤 → 對方一句「金額有誤」拖延",
      "未提及法定遲延利息 → 後續訴訟不能追溯起算日",
    ],
    keyClauses: [
      { name: "事實摘要", why: "明列原契約、債權緣由、金額", ref: "民法 §229" },
      { name: "法定遲延利息", why: "年息 5% 自應給付日翌日起算", ref: "民法 §233" },
      { name: "寬限期與後續處理", why: "通常 7–10 日，逾期改寄存證信函", ref: "民法 §250" },
    ],
    faqs: [
      { q: "催款通知書跟存證信函有什麼不同？", a: "催款通知書是商業意義上的催告，存證信函是郵局留底的正式法律意思表示。實務上先催款（內部往來），無效再寄存證信函（轉訴訟前）。" },
    ],
  },
  "cert-mail": {
    intent: "依郵政存證信函格式產出之 PDF 草稿，作為意思表示送達之證據。本平台僅產草稿，使用者需親至郵局以掛號方式寄出。",
    useCases: ["催告履約 / 給付款項", "解除契約之意思表示", "終止租賃 / 委任", "停止侵權警告"],
    pitfalls: [
      "未送達不生效力（民法 §95）→ 雙掛號回執最重要",
      "內容過於情緒化 → 反成日後不利證據",
      "用詞錯誤（例：要求 vs 請求）→ 後續訴訟主張變難",
    ],
    keyClauses: [
      { name: "主旨", why: "一句話講完訴求，方便對方快速理解", ref: "民法 §94" },
      { name: "事實 / 請求 / 期限", why: "三段式：先敘事實，再列請求，最後給期限", ref: "民法 §95" },
    ],
    faqs: [
      { q: "存證信函寄出後對方不回怎麼辦？", a: "意思表示一經到達即生效（民法 §95），對方收到不論是否回應皆不影響效力。逾期未處理可進入下一步（支付命令 / 訴訟）。" },
      { q: "可以用 Email 取代存證信函嗎？", a: "Email 可送達意思表示，但證明力較低（對方可能否認收到）。郵政存證信函有郵局存查、有掛號回執，訴訟證據力最強。" },
    ],
  },
  custom: {
    intent: "從空白模板自訂條款，適合特殊或非標準合作關係。本平台提供風險檢查協助辨識常見高風險寫法。",
    useCases: ["跨領域非典型合作", "創投投資協議", "客製化技術授權", "藝人經紀"],
    pitfalls: [
      "條款抄寫自網路範本 → 法源與本案不符",
      "缺管轄法院條款 → 訴訟地點不確定",
      "未排除單方解除權 → 簽完即可被一方撤回",
    ],
    keyClauses: [
      { name: "當事人", why: "雙方識別資料完整", ref: "民法 §153" },
      { name: "契約內容", why: "逐條編號、明確、可執行", ref: "" },
    ],
    faqs: [
      { q: "自訂模板能用 DocGen TW 的風險檢查嗎？", a: "可以。系統會以關鍵字 + 規則式檢測常見高風險寫法（如全面拋棄請求權、單方終止），但客製合約強烈建議律師審閱。" },
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tpl = getTemplate(id);
  if (!tpl) return { title: "範本不存在" };
  return {
    title: `${tpl.name} 線上產生 + 電子簽署 · DocGen TW`,
    description: `${tpl.name}範本，引用 ${tpl.legal.join("、")} 等中華民國法令；3 分鐘填表、雙方電子簽署、留存 IP/時間戳/簽名雜湊。`,
    openGraph: {
      title: `${tpl.name} 線上產生器 · 附法條依據`,
      description: COPY[id]?.intent ?? `${tpl.name}範本`,
    },
  };
}

export default async function TemplateLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tpl = getTemplate(id);
  if (!tpl) notFound();
  const copy = COPY[id];

  const pageUrl = `${SITE_URL}/templates/${tpl.id}`;
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: tpl.name,
    serviceType: "Contract document automation",
    provider: {
      "@type": "Organization",
      name: "DocGen TW",
      url: SITE_URL,
    },
    areaServed: { "@type": "Country", name: "Taiwan" },
    description: copy?.intent ?? tpl.description,
    url: pageUrl,
    offers: {
      "@type": "Offer",
      price: "99",
      priceCurrency: "TWD",
      availability: "https://schema.org/InStock",
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: tpl.category, item: `${SITE_URL}/#templates` },
      { "@type": "ListItem", position: 3, name: tpl.name, item: pageUrl },
    ],
  };
  const faqLd = copy && copy.faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: copy.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <>
      <TopNav />
      <JsonLd data={serviceLd} />
      <JsonLd data={breadcrumbLd} />
      {faqLd && <JsonLd data={faqLd} />}
      <main className="page paper-bg">
        <section className="container" style={{ padding: "32px 32px 16px", maxWidth: 900 }}>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            <Icon name={tpl.icon} size={13} /> {tpl.category}
          </div>
          <h1 style={{ fontSize: 44, lineHeight: 1.1 }}>{tpl.name}</h1>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--ink-soft)", marginTop: 12 }}>
            {copy?.intent ?? tpl.description}
          </p>
          <div className="row gap-2" style={{ marginTop: 18, flexWrap: "wrap" }}>
            <Link href={`/contracts/new?tpl=${tpl.id}`} className="btn btn-primary btn-lg">
              <Icon name="sparkles" size={14} />使用本範本
            </Link>
            <a href="#legal" className="btn btn-soft">
              <Icon name="scale" size={13} />查看法條依據
            </a>
          </div>
        </section>

        {copy && (
          <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 900 }}>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>誰會用到</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 22 }}>
              {copy.useCases.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </section>
        )}

        {copy && (
          <section id="legal" className="container" style={{ padding: "12px 32px 24px", maxWidth: 900 }}>
            <h2 style={{ fontSize: 24, marginBottom: 14 }}>核心條款 · 為什麼這樣寫</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {copy.keyClauses.map((c) => (
                <div key={c.name} className="card" style={{
                  padding: 16, background: "var(--bg-elev)",
                  border: "1px solid var(--line)", borderRadius: "var(--radius)",
                }}>
                  <div className="row gap-2" style={{ alignItems: "center", marginBottom: 6 }}>
                    <b style={{ fontSize: 15 }}>{c.name}</b>
                    {c.ref && (
                      <span className="chip chip-mono" style={{ fontSize: 11 }}>{c.ref}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.7, margin: 0 }}>{c.why}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {copy && (
          <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 900 }}>
            <h2 style={{ fontSize: 24, marginBottom: 14 }}>常見踩雷</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 22 }}>
              {copy.pitfalls.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </section>
        )}

        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 900 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>本範本引用之法令</h2>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {tpl.legal.map((l) => (
              <span key={l} className="chip chip-mono" style={{ fontSize: 12, padding: "4px 10px" }}>{l}</span>
            ))}
          </div>
        </section>

        {copy && copy.faqs.length > 0 && (
          <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 900 }}>
            <h2 style={{ fontSize: 24, marginBottom: 14 }}>常見問題</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {copy.faqs.map((f) => (
                <details key={f.q} className="card" style={{
                  padding: 16, background: "var(--bg-elev)",
                  border: "1px solid var(--line)", borderRadius: "var(--radius)",
                }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, listStyle: "none" }}>{f.q}</summary>
                  <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: "var(--ink-soft)" }}>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="container" style={{ padding: "24px 32px 24px", maxWidth: 900 }}>
          <div className="card" style={{
            padding: 22, background: "var(--bg-elev)", border: "1px solid var(--line)",
            borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: 10,
          }}>
            <h3 style={{ fontSize: 20 }}>準備好了嗎？</h3>
            <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
              3 分鐘填表，自動引用法條，雙方電子簽署，留存 IP 與簽名雜湊。
            </p>
            <Link href={`/contracts/new?tpl=${tpl.id}`} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
              <Icon name="sparkles" size={13} />建立 {tpl.name}
            </Link>
          </div>
        </section>

        <section className="container" style={{ padding: "12px 32px 64px", maxWidth: 900 }}>
          <LegalDisclaimer />
        </section>

        <Footer />
      </main>
    </>
  );
}
