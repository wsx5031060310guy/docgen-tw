import { numberToChinese, todayMinguo } from "./numberToChinese";

export type FieldType = "text" | "textarea" | "number" | "select" | "date";
export type Values = Record<string, string>;

export type TemplateField = {
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: FieldType;
  span?: 1 | 2;
  group: string;
  options?: { value: string; label: string }[];
};

export type Clause = { n: number; title: string; body: string; ref: string[] };

export type Template = {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  legal: string[];
  defaults: Values;
  fields: TemplateField[];
  groups: Record<string, string>;
  clauses: (v: Values) => Clause[];
};

const FREELANCE: Template = {
  id: "freelance", name: "接案 / 承攬合約", category: "專業服務", icon: "briefcase",
  description: "適用於設計、開發、文案等一次性專案承攬。明定交付物、報酬、智慧財產權歸屬。",
  legal: ["民法 §490", "民法 §505", "著作權法 §12", "民法 §250"],
  defaults: {
    party_a_name: "", party_a_id: "", party_a_email: "",
    party_b_name: "", party_b_id: "", party_b_email: "",
    scope: "", deliverable: "", deadline: "",
    amount: "", payment_terms: "完工驗收後 14 日內一次給付",
    ip_owner: "a", penalty_rate: "0.1", sign_date: todayMinguo(),
  },
  fields: [
    { id: "party_a_name", label: "委任方姓名 / 公司", placeholder: "王小明 / 某某有限公司", required: true, group: "parties" },
    { id: "party_a_id",   label: "委任方統編 / 身分證", placeholder: "12345678", group: "parties" },
    { id: "party_a_email", label: "委任方 Email", placeholder: "a@example.com", group: "parties" },
    { id: "party_b_name", label: "受任方姓名 / 公司", placeholder: "陳設計", required: true, group: "parties" },
    { id: "party_b_id",   label: "受任方統編 / 身分證", placeholder: "A123456789", group: "parties" },
    { id: "party_b_email", label: "受任方 Email（簽完後寄送 PDF）", placeholder: "b@example.com", group: "parties" },
    { id: "scope", label: "工作項目", placeholder: "品牌識別系統設計，含 logo、配色與字型規範", required: true, type: "textarea", span: 2, group: "work" },
    { id: "deliverable", label: "交付物", placeholder: "AI 原始檔、PDF 規範手冊各一份", type: "textarea", span: 2, group: "work" },
    { id: "deadline", label: "交付期限", placeholder: "2026/06/30", required: true, group: "work" },
    { id: "amount", label: "報酬金額（新臺幣）", placeholder: "120000", required: true, type: "number", group: "pay" },
    { id: "payment_terms", label: "付款方式", type: "textarea", span: 2, group: "pay" },
    { id: "ip_owner", label: "著作權歸屬", type: "select", group: "pay",
      options: [
        { value: "a", label: "委任方（出資人）" },
        { value: "b", label: "受任方（受聘人）" },
        { value: "shared", label: "雙方共有" },
      ] },
    { id: "penalty_rate", label: "逾期違約金（每日 %）", placeholder: "0.1", type: "number", group: "pay" },
  ],
  groups: { parties: "雙方資訊", work: "工作內容", pay: "報酬與權利" },
  clauses: (v) => [
    { n: 1, title: "契約主旨",
      body: `委任方 「{{party_a_name}}」（統一編號 / 身分證字號：{{party_a_id}}，下稱「甲方」）與受任方 「{{party_b_name}}」（統一編號 / 身分證字號：{{party_b_id}}，下稱「乙方」）就下列事項，本於誠實信用原則，依民法第四百九十條承攬之規定訂立本契約。`,
      ref: ["民法 §490", "民法 §153"] },
    { n: 2, title: "工作範圍",
      body: `乙方應為甲方完成下列工作：\n{{scope}}\n\n乙方應交付下列成果：\n{{deliverable}}`, ref: [] },
    { n: 3, title: "交付期限",
      body: `乙方應於 {{deadline}} 前完成全部工作並交付甲方驗收。如因不可歸責於乙方之事由致無法準時交付者，雙方應協議延期。`, ref: [] },
    { n: 4, title: "報酬與付款",
      body: `本契約之報酬總額為新臺幣 {{amount_chinese}} 元整（NT$ {{amount}}）。\n付款方式：{{payment_terms}}。\n甲方應於前述期限內依乙方指定之方式為給付。`,
      ref: ["民法 §505"] },
    { n: 5, title: "智慧財產權",
      body: v.ip_owner === "a"
        ? `乙方完成之工作成果（含著作權、商標權及其他智慧財產權），自報酬全額給付完成之日起，全部歸甲方所有；乙方應協同辦理一切權利移轉手續。`
        : v.ip_owner === "b"
        ? `乙方完成之工作成果，其著作權及相關智慧財產權歸乙方所有，甲方僅取得依本契約目的範圍內之非專屬授權。`
        : `乙方完成之工作成果，其著作權及相關智慧財產權由甲乙雙方共有，任一方利用前應徵得他方書面同意。`,
      ref: ["著作權法 §12"] },
    { n: 6, title: "逾期違約金",
      body: `乙方逾期交付者，每逾一日應按本契約報酬總額之 {{penalty_rate}}% 計付違約金，但違約金總額以本契約報酬之 20% 為上限。`,
      ref: ["民法 §250"] },
    { n: 7, title: "保密義務",
      body: `雙方對於因履行本契約而知悉之他方營業秘密、客戶資料及其他非公開資訊，於本契約終止後 三 年內仍負保密義務。`,
      ref: ["營業秘密法 §2"] },
    { n: 8, title: "管轄法院",
      body: `因本契約所生爭議，雙方同意以 臺灣臺北地方法院 為第一審管轄法院。`, ref: [] },
    { n: 9, title: "電子簽署",
      body: `本契約經雙方以電子簽章方式簽署完成，依電子簽章法第四條、第九條，與紙本簽署具同等法律效力。系統將留存簽署時間戳記、IP 位址及簽名雜湊值供查驗。`,
      ref: ["電簽法 §4", "電簽法 §9"] },
  ],
};

const NDA: Template = {
  id: "nda", name: "保密協議 NDA", category: "商業合作", icon: "shield",
  description: "雙方在合作或洽談前互負保密義務，防止營業秘密、客戶資料外流。",
  legal: ["民法 §227", "營業秘密法 §2", "個資法 §27"],
  defaults: { party_a_name: "", party_a_id: "", party_b_name: "", party_b_id: "", purpose: "", term_years: "3", penalty: "500000", sign_date: todayMinguo() },
  fields: [
    { id: "party_a_name", label: "甲方姓名 / 公司", required: true, group: "parties" },
    { id: "party_a_id", label: "甲方統編 / 身分證", group: "parties" },
    { id: "party_b_name", label: "乙方姓名 / 公司", required: true, group: "parties" },
    { id: "party_b_id", label: "乙方統編 / 身分證", group: "parties" },
    { id: "purpose", label: "保密目的 / 合作主題", required: true, type: "textarea", span: 2, group: "work" },
    { id: "term_years", label: "保密期間（年）", required: true, type: "number", group: "work" },
    { id: "penalty", label: "違約懲罰性違約金（新臺幣）", type: "number", group: "work" },
  ],
  groups: { parties: "雙方資訊", work: "保密範圍" },
  clauses: () => [
    { n: 1, title: "締約目的", body: `甲方「{{party_a_name}}」與乙方「{{party_b_name}}」為下列目的進行合作或洽談：\n{{purpose}}\n為保護雙方因此揭露之機密資訊，特訂立本協議。`, ref: ["民法 §153"] },
    { n: 2, title: "機密資訊定義", body: `本協議所稱機密資訊，係指任何一方以口頭、書面、電子或其他形式所揭露，且符合營業秘密法第二條要件之資訊，包括但不限於：技術、製程、客戶名單、財務、產品計畫、原始碼及個人資料。`, ref: ["營業秘密法 §2", "個資法 §27"] },
    { n: 3, title: "保密義務", body: `受領方應以善良管理人之注意義務保管機密資訊，僅得用於前述目的，非經揭露方書面同意，不得向第三人揭露或為其他目的利用。`, ref: ["民法 §535"] },
    { n: 4, title: "保密期間", body: `本協議自雙方簽署之日起生效，保密義務於協議終止後 {{term_years}} 年內繼續有效。`, ref: [] },
    { n: 5, title: "違約責任", body: `任一方違反本協議者，應賠償他方因此所受之一切損害，並另應給付懲罰性違約金新臺幣 {{penalty}} 元。`, ref: ["民法 §227", "民法 §250"] },
    { n: 6, title: "管轄法院", body: `因本協議所生爭議，雙方同意以 臺灣臺北地方法院 為第一審管轄法院。`, ref: [] },
    { n: 7, title: "電子簽署", body: `本協議以電子簽章方式簽署，與書面具同等效力。`, ref: ["電簽法 §4", "電簽法 §9"] },
  ],
};

const LOAN: Template = {
  id: "loan", name: "消費借貸契約", category: "金錢往來", icon: "banknote",
  description: "個人或公司間借款，明定金額、利率、還款期限。利率自動套用 §205 上限檢核。",
  legal: ["民法 §474", "民法 §205"],
  defaults: { party_a_name: "", party_b_name: "", amount: "", rate: "5", term_months: "12", repay_day: "5", sign_date: todayMinguo() },
  fields: [
    { id: "party_a_name", label: "貸與人（出借人）", required: true, group: "parties" },
    { id: "party_b_name", label: "借用人", required: true, group: "parties" },
    { id: "amount", label: "借款金額（新臺幣）", type: "number", required: true, group: "work" },
    { id: "rate", label: "年利率（%，§205 上限 16）", type: "number", required: true, group: "work" },
    { id: "term_months", label: "借款期間（月）", type: "number", required: true, group: "work" },
    { id: "repay_day", label: "每月還款日", type: "number", group: "work" },
  ],
  groups: { parties: "雙方資訊", work: "借款條件" },
  clauses: () => [
    { n: 1, title: "借款金額與交付", body: `貸與人「{{party_a_name}}」（下稱甲方）借予借用人「{{party_b_name}}」（下稱乙方）新臺幣 {{amount_chinese}} 元整（NT$ {{amount}}），乙方應於本契約簽署日收訖。`, ref: ["民法 §474"] },
    { n: 2, title: "利率", body: `本借款年利率為百分之 {{rate}}（依民法第二百零五條規定，約定利率不得逾年息百分之十六）。`, ref: ["民法 §205"] },
    { n: 3, title: "還款方式", body: `借款期間共 {{term_months}} 個月，乙方應自次月起每月 {{repay_day}} 日按月平均攤還本息予甲方指定帳戶。`, ref: [] },
    { n: 4, title: "提前清償", body: `乙方得隨時提前清償全部或一部借款，無須支付違約金。`, ref: [] },
    { n: 5, title: "違約處理", body: `乙方逾期未還達 30 日者，視為全部到期，甲方得就剩餘本息一次請求，並得依法聲請強制執行。`, ref: ["民法 §250"] },
    { n: 6, title: "管轄法院", body: `因本契約所生爭議，以 臺灣臺北地方法院 為第一審管轄法院。`, ref: [] },
  ],
};

const CONSIGN: Template = {
  id: "consign", name: "委任契約", category: "事務代辦", icon: "sign",
  description: "委由他人處理特定事務，例如代辦、代理、財產管理。受任人負善良管理人注意義務。",
  legal: ["民法 §528", "民法 §535"],
  defaults: { party_a_name: "", party_b_name: "", task: "", fee: "", term: "", sign_date: todayMinguo() },
  fields: [
    { id: "party_a_name", label: "委任人", required: true, group: "parties" },
    { id: "party_b_name", label: "受任人", required: true, group: "parties" },
    { id: "task", label: "委任事務", required: true, type: "textarea", span: 2, group: "work" },
    { id: "fee", label: "報酬", type: "number", group: "work" },
    { id: "term", label: "委任期間", placeholder: "2026/01/01 - 2026/12/31", group: "work" },
  ],
  groups: { parties: "雙方資訊", work: "委任內容" },
  clauses: () => [
    { n: 1, title: "委任事務", body: `委任人「{{party_a_name}}」委託受任人「{{party_b_name}}」處理下列事務：\n{{task}}`, ref: ["民法 §528"] },
    { n: 2, title: "注意義務", body: `受任人於受有報酬之情形下，應以善良管理人之注意處理委任事務。`, ref: ["民法 §535"] },
    { n: 3, title: "期間與報酬", body: `委任期間為 {{term}}。委任人應於事務處理完畢後給付報酬新臺幣 {{fee_chinese}} 元整（NT$ {{fee}}）。`, ref: [] },
    { n: 4, title: "終止", body: `當事人之任一方得隨時終止本契約，但於不利於他方之時期終止者，應賠償他方因此所受之損害。`, ref: [] },
    { n: 5, title: "管轄法院", body: `因本契約所生爭議，以 臺灣臺北地方法院 為第一審管轄法院。`, ref: [] },
  ],
};

const EMPLOY: Template = {
  id: "employ", name: "勞動契約", category: "聘僱關係", icon: "building",
  description: "雇主與勞工之勞動契約，含工資、工時、休假等勞動基準法強制規定。",
  legal: ["勞基法 §9", "勞基法 §21", "勞基法 §22"],
  defaults: { party_a_name: "", party_b_name: "", position: "", start_date: "", salary: "", work_hours: "8", sign_date: todayMinguo() },
  fields: [
    { id: "party_a_name", label: "雇主 / 公司", required: true, group: "parties" },
    { id: "party_b_name", label: "勞工姓名", required: true, group: "parties" },
    { id: "position", label: "職稱 / 工作內容", required: true, type: "textarea", span: 2, group: "work" },
    { id: "start_date", label: "到職日", required: true, group: "work" },
    { id: "salary", label: "月薪（新臺幣）", type: "number", required: true, group: "work" },
    { id: "work_hours", label: "每日正常工時", type: "number", group: "work" },
  ],
  groups: { parties: "雙方資訊", work: "聘僱條件" },
  clauses: () => [
    { n: 1, title: "契約性質", body: `雇主「{{party_a_name}}」聘僱勞工「{{party_b_name}}」擔任：\n{{position}}\n本契約為不定期契約，依勞動基準法第九條之規定。`, ref: ["勞基法 §9"] },
    { n: 2, title: "到職日與工時", body: `勞工應於 {{start_date}} 到職。每日正常工時 {{work_hours}} 小時，每週不得超過四十小時。`, ref: [] },
    { n: 3, title: "工資", body: `月薪新臺幣 {{salary_chinese}} 元整（NT$ {{salary}}），於每月 5 日以匯款方式給付。工資不得低於行政院公告之基本工資。`, ref: ["勞基法 §21", "勞基法 §22"] },
    { n: 4, title: "休假", body: `勞工依勞基法享有特別休假、請假及國定假日。`, ref: [] },
    { n: 5, title: "保密與競業", body: `勞工於在職及離職後 一 年內，不得使用或洩漏雇主之營業秘密。`, ref: ["營業秘密法 §2"] },
    { n: 6, title: "管轄法院", body: `因本契約所生爭議，以勞工提供勞務地之地方法院為管轄法院。`, ref: [] },
  ],
};

const LEASE: Template = {
  id: "lease", name: "租賃契約", category: "不動產", icon: "home",
  description: "房屋或土地租賃，含租金、押金、修繕、提前終止等條款。",
  legal: ["民法 §421", "民法 §439"],
  defaults: { party_a_name: "", party_b_name: "", address: "", rent: "", deposit: "", term: "", sign_date: todayMinguo() },
  fields: [
    { id: "party_a_name", label: "出租人", required: true, group: "parties" },
    { id: "party_b_name", label: "承租人", required: true, group: "parties" },
    { id: "address", label: "租賃標的（地址）", required: true, type: "textarea", span: 2, group: "work" },
    { id: "rent", label: "月租金（新臺幣）", type: "number", required: true, group: "work" },
    { id: "deposit", label: "押金（新臺幣）", type: "number", group: "work" },
    { id: "term", label: "租賃期間", placeholder: "2026/01/01 - 2027/12/31", group: "work" },
  ],
  groups: { parties: "雙方資訊", work: "租賃條件" },
  clauses: () => [
    { n: 1, title: "租賃標的", body: `出租人「{{party_a_name}}」將下列不動產出租予承租人「{{party_b_name}}」：\n{{address}}`, ref: ["民法 §421"] },
    { n: 2, title: "租賃期間", body: `租賃期間為 {{term}}。`, ref: [] },
    { n: 3, title: "租金與押金", body: `月租金新臺幣 {{rent}} 元，承租人應於每月 5 日前匯入出租人指定帳戶。押金新臺幣 {{deposit}} 元，於本契約終止且租賃物返還無瑕疵時，無息返還。`, ref: ["民法 §439"] },
    { n: 4, title: "使用方式", body: `承租人應依租賃物之性質為通常之使用，不得違法使用或轉租。`, ref: [] },
    { n: 5, title: "修繕", body: `租賃物之修繕，除契約另有約定外，由出租人負擔。`, ref: [] },
    { n: 6, title: "管轄法院", body: `因本契約所生爭議，以租賃物所在地之地方法院為管轄法院。`, ref: [] },
  ],
};

const SALE: Template = {
  id: "sale", name: "買賣契約", category: "商品交易", icon: "file",
  description: "買賣動產或不動產，含標的物、價金、交付、瑕疵擔保。",
  legal: ["民法 §345", "民法 §354"],
  defaults: { party_a_name: "", party_b_name: "", item: "", price: "", delivery: "", sign_date: todayMinguo() },
  fields: [
    { id: "party_a_name", label: "出賣人", required: true, group: "parties" },
    { id: "party_b_name", label: "買受人", required: true, group: "parties" },
    { id: "item", label: "買賣標的物", required: true, type: "textarea", span: 2, group: "work" },
    { id: "price", label: "價金（新臺幣）", type: "number", required: true, group: "work" },
    { id: "delivery", label: "交付方式 / 地點", type: "textarea", span: 2, group: "work" },
  ],
  groups: { parties: "雙方資訊", work: "交易條件" },
  clauses: () => [
    { n: 1, title: "買賣標的", body: `出賣人「{{party_a_name}}」將下列標的物出賣予買受人「{{party_b_name}}」：\n{{item}}`, ref: ["民法 §345"] },
    { n: 2, title: "價金", body: `總價金為新臺幣 {{price_chinese}} 元整（NT$ {{price}}）。`, ref: [] },
    { n: 3, title: "交付", body: `交付方式：\n{{delivery}}`, ref: [] },
    { n: 4, title: "瑕疵擔保", body: `出賣人應擔保標的物於危險移轉時無滅失或減少其價值之瑕疵。買受人發現瑕疵應於六個月內通知出賣人。`, ref: ["民法 §354"] },
    { n: 5, title: "管轄法院", body: `因本契約所生爭議，以 臺灣臺北地方法院 為第一審管轄法院。`, ref: [] },
  ],
};

const CUSTOM: Template = {
  id: "custom", name: "自訂模板", category: "空白契約", icon: "document",
  description: "從零開始撰寫，AI 將協助你逐條檢核法律依據。適合特殊或非標準合作。",
  legal: ["民法 §153"],
  defaults: { party_a_name: "", party_b_name: "", body: "", sign_date: todayMinguo() },
  fields: [
    { id: "party_a_name", label: "甲方", required: true, group: "parties" },
    { id: "party_b_name", label: "乙方", required: true, group: "parties" },
    { id: "body", label: "契約內文", required: true, type: "textarea", span: 2, group: "work", placeholder: "逐條撰寫，例：\n第一條 ...\n第二條 ..." },
  ],
  groups: { parties: "雙方資訊", work: "契約內容" },
  clauses: () => [
    { n: 1, title: "當事人", body: `甲方「{{party_a_name}}」與乙方「{{party_b_name}}」訂立本契約，雙方同意遵守下列各條規定。`, ref: ["民法 §153"] },
    { n: 2, title: "契約內容", body: `{{body}}`, ref: [] },
  ],
};

const DUNNING: Template = {
  id: "dunning", name: "催款通知書", category: "債權催告", icon: "alert",
  description: "對逾期付款相對人發出之催告函（民法 §229 給付遲延）。可作為日後存證信函或起訴前之證據。",
  legal: ["民法 §229", "民法 §233", "民法 §250"],
  defaults: {
    party_a_name: "", party_a_address: "",
    party_b_name: "", party_b_address: "",
    contract_subject: "", original_due_date: "",
    amount_owed: "", interest_rate: "5",
    grace_days: "7", sign_date: todayMinguo(),
  },
  fields: [
    { id: "party_a_name", label: "債權人（您方）", required: true, group: "parties" },
    { id: "party_a_address", label: "債權人地址", type: "textarea", span: 2, group: "parties" },
    { id: "party_b_name", label: "債務人（相對人）", required: true, group: "parties" },
    { id: "party_b_address", label: "債務人地址", type: "textarea", span: 2, group: "parties" },
    { id: "contract_subject", label: "原契約 / 債權緣由", required: true, type: "textarea", span: 2, group: "work",
      placeholder: "例：2026/03/01 簽訂之承攬契約第三條報酬" },
    { id: "original_due_date", label: "原應給付日", required: true, group: "work",
      placeholder: "2026/04/30" },
    { id: "amount_owed", label: "尚欠金額（新臺幣）", type: "number", required: true, group: "work" },
    { id: "interest_rate", label: "法定遲延利息（年息 %，民法 §233 預設 5）", type: "number", group: "work" },
    { id: "grace_days", label: "催告寬限期（日）", type: "number", required: true, group: "work" },
  ],
  groups: { parties: "雙方資訊", work: "債權內容" },
  clauses: () => [
    { n: 1, title: "事實摘要",
      body: `茲就 台端「{{party_b_name}}」與本人「{{party_a_name}}」間，因 {{contract_subject}} 所生之債務，依約應於 {{original_due_date}} 給付新臺幣 {{amount_owed_chinese}} 元整（NT$ {{amount_owed}}），惟迄今尚未獲清償。`,
      ref: ["民法 §229"] },
    { n: 2, title: "催告意旨",
      body: `依民法第二二九條規定，給付有確定期限者，債務人自期限屆滿時起，負遲延責任。台端既已逾原約定給付期，自應負給付遲延之責。`,
      ref: ["民法 §229"] },
    { n: 3, title: "法定遲延利息",
      body: `依民法第二三三條，遲延之債務，以支付金錢為標的者，債權人得請求依法定利率計算之遲延利息。本債務自 {{original_due_date}} 翌日起，按年息百分之 {{interest_rate}} 計算遲延利息。`,
      ref: ["民法 §233"] },
    { n: 4, title: "寬限期與後續處理",
      body: `為維雙方情誼，本人特給予 {{grace_days}} 日寬限期，請台端自收受本通知翌日起 {{grace_days}} 日內，將前述本金及利息匯入本人指定帳戶。逾期未獲清償者，本人將依法另以存證信函正式催告並保留一切法律追訴權利，包括但不限於聲請支付命令、強制執行及訴訟程序。`,
      ref: ["民法 §250"] },
    { n: 5, title: "本通知性質",
      body: `本通知為民事債務之催告通知，不具強制執行效力。如台端對本債務有異議，請於前述寬限期內以書面提出，逾期未提出視為無異議。`, ref: [] },
  ],
};

const CERT_MAIL: Template = {
  id: "cert-mail", name: "存證信函草稿", category: "債權催告", icon: "mail",
  description: "依郵政存證信函格式產出之草稿 PDF。本平台僅產 PDF，使用者需親至郵局以掛號方式寄出。",
  legal: ["郵政法 §10", "民法 §94", "民法 §95"],
  defaults: {
    party_a_name: "", party_a_address: "",
    party_b_name: "", party_b_address: "",
    subject: "", facts: "", request: "",
    deadline_days: "10", sign_date: todayMinguo(),
  },
  fields: [
    { id: "party_a_name", label: "寄件人姓名 / 公司", required: true, group: "parties" },
    { id: "party_a_address", label: "寄件人地址", type: "textarea", span: 2, required: true, group: "parties" },
    { id: "party_b_name", label: "收件人姓名 / 公司", required: true, group: "parties" },
    { id: "party_b_address", label: "收件人地址", type: "textarea", span: 2, required: true, group: "parties" },
    { id: "subject", label: "主旨（一句話）", required: true, type: "textarea", span: 2, group: "work",
      placeholder: "例：請於收文 10 日內給付承攬報酬新臺幣 12 萬元" },
    { id: "facts", label: "事實經過", required: true, type: "textarea", span: 2, group: "work",
      placeholder: "簡述締約、履約、違約事實，分點寫" },
    { id: "request", label: "請求事項", required: true, type: "textarea", span: 2, group: "work",
      placeholder: "請台端為何種行為，例如：給付款項 / 返還物品 / 停止侵害" },
    { id: "deadline_days", label: "期限（自收文起算 日）", type: "number", required: true, group: "work" },
  ],
  groups: { parties: "寄收件人", work: "信函內容" },
  clauses: () => [
    { n: 1, title: "主旨",
      body: `{{subject}}`, ref: [] },
    { n: 2, title: "說明 ── 事實",
      body: `一、緣下列事實：\n{{facts}}`, ref: ["民法 §94"] },
    { n: 3, title: "說明 ── 請求",
      body: `二、為此特函請台端：\n{{request}}\n請於收受本存證信函翌日起 {{deadline_days}} 日內辦理為荷。`,
      ref: ["民法 §95"] },
    { n: 4, title: "說明 ── 法律保留",
      body: `三、本函依郵政存證信函辦法製作，作為意思表示送達之證據。倘逾期未獲處理，本人將依法循民事或刑事程序主張權利，特此通知，俾免訟累。`,
      ref: ["郵政法 §10"] },
    { n: 5, title: "使用方式（非信函內容，僅為說明）",
      body: `※ 本 PDF 為草稿，請依下列步驟辦理：\n1. 至全台各郵局櫃台索取「郵政存證信函」三聯式專用紙，將本草稿內容謄寫或列印於專用紙。\n2. 一式三份（寄件人、收件人、郵局存查各一份）。\n3. 以雙掛號方式寄出，保留收據與回執。\n4. 收件人收受後即生「意思表示到達」效力（民法 §95）。`,
      ref: [] },
  ],
};

export const TEMPLATES: Template[] = [FREELANCE, NDA, LOAN, CONSIGN, EMPLOY, LEASE, SALE, DUNNING, CERT_MAIL, CUSTOM];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

const PLACEHOLDER = "__________";

export function fillTemplate(text: string, values: Values): string {
  if (!text) return "";
  return text.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => {
    if (key.endsWith("_chinese")) {
      const base = key.slice(0, -"_chinese".length);
      const cn = numberToChinese(values[base]);
      return cn || "_______";
    }
    const v = values[key];
    return v === undefined || v === null || String(v).trim() === "" ? PLACEHOLDER : String(v);
  });
}

export function buildContractDocument(templateId: string, values: Values) {
  const t = getTemplate(templateId);
  if (!t) throw new Error(`Unknown template: ${templateId}`);
  const clauses = t.clauses(values).map((c) => ({
    n: c.n, title: c.title, body: fillTemplate(c.body, values), ref: c.ref,
  }));
  return {
    title: t.name,
    category: t.category,
    legalBasis: t.legal,
    clauses,
    footer: "本契約以電子簽章方式簽署，依電子簽章法第 4 條、第 9 條，與紙本簽署具同等法律效力。",
    disclaimer: "本平台提供之合約模板與條款建議，係依中華民國現行法律一般情形編製，僅供一般參考用途。重大交易、跨境合作或具爭議性事項，建議委請執業律師審閱。",
    generatedAt: new Date().toISOString(),
  };
}
