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
  description: "適用於設計、開發、文案等一次性專案承攬。明定交付物、里程碑付款、驗收、保固與智慧財產權歸屬。",
  legal: ["民法 §490", "民法 §505", "民法 §507", "著作權法 §12", "著作權法 §21", "著作權法 §37", "民法 §250", "電子簽章法 §5", "電子簽章法 §6"],
  defaults: {
    party_a_name: "", party_a_id: "", party_a_email: "",
    party_b_name: "", party_b_id: "", party_b_email: "",
    scope: "", deliverable: "", deadline: "",
    amount: "", milestones: "簽約 30%、開發完成 40%、驗收通過 30%",
    interest_rate: "5",
    acceptance_days: "7", fix_days: "10", warranty_months: "6",
    change_reply_days: "5", penalty_cap_pct: "20", fm_days: "30", cure_days: "14",
    ip_owner: "a", penalty_rate: "0.1", court: "臺灣臺北地方法院", sign_date: todayMinguo(),
  },
  fields: [
    { id: "party_a_name", label: "定作人（甲方）姓名 / 公司", placeholder: "王小明 / 某某有限公司", required: true, group: "parties" },
    { id: "party_a_id",   label: "定作人統編 / 身分證", placeholder: "12345678", group: "parties" },
    { id: "party_a_email", label: "定作人 Email", placeholder: "a@example.com", group: "parties" },
    { id: "party_b_name", label: "承攬人（乙方）姓名 / 公司", placeholder: "陳設計", required: true, group: "parties" },
    { id: "party_b_id",   label: "承攬人統編 / 身分證", placeholder: "A123456789", group: "parties" },
    { id: "party_b_email", label: "承攬人 Email（簽完後寄送 PDF）", placeholder: "b@example.com", group: "parties" },
    { id: "scope", label: "工作項目", placeholder: "品牌識別系統設計，含 logo、配色與字型規範", required: true, type: "textarea", span: 2, group: "work" },
    { id: "deliverable", label: "交付物", placeholder: "AI 原始檔、PDF 規範手冊各一份", type: "textarea", span: 2, group: "work" },
    { id: "deadline", label: "交付期限", placeholder: "2026/06/30", required: true, group: "work" },
    { id: "amount", label: "報酬金額（新臺幣）", placeholder: "120000", required: true, type: "number", group: "pay" },
    { id: "milestones", label: "里程碑付款比例", placeholder: "簽約 30%、開發完成 40%、驗收通過 30%", type: "textarea", span: 2, group: "pay" },
    { id: "interest_rate", label: "遲延利息（年息 %）", placeholder: "5", type: "number", group: "pay" },
    { id: "ip_owner", label: "著作權歸屬", type: "select", group: "pay",
      options: [
        { value: "a", label: "定作人（出資人）" },
        { value: "b", label: "承攬人（受聘人）" },
        { value: "shared", label: "雙方共有" },
      ] },
    { id: "penalty_rate", label: "逾期違約金（每日 %）", placeholder: "0.1", type: "number", group: "pay" },
    { id: "penalty_cap_pct", label: "違約金總額上限（%）", placeholder: "20", type: "number", group: "pay" },
    { id: "acceptance_days", label: "驗收天數", placeholder: "7", type: "number", group: "terms" },
    { id: "fix_days", label: "瑕疵修補天數", placeholder: "10", type: "number", group: "terms" },
    { id: "warranty_months", label: "保固月數", placeholder: "6", type: "number", group: "terms" },
    { id: "change_reply_days", label: "變更評估回覆天數", placeholder: "5", type: "number", group: "terms" },
    { id: "cure_days", label: "違約催告改正天數", placeholder: "14", type: "number", group: "terms" },
    { id: "fm_days", label: "不可抗力得終止天數", placeholder: "30", type: "number", group: "terms" },
    { id: "court", label: "管轄法院", placeholder: "臺灣臺北地方法院", group: "terms" },
  ],
  groups: { parties: "雙方資訊", work: "工作內容", pay: "報酬與權利", terms: "履約與保固" },
  clauses: (v) => [
    { n: 1, title: "契約主旨",
      body: `定作人 「{{party_a_name}}」（統一編號 / 身分證字號：{{party_a_id}}，下稱「甲方」）與承攬人 「{{party_b_name}}」（統一編號 / 身分證字號：{{party_b_id}}，下稱「乙方」）就下列事項，本於誠實信用原則，依民法第四百九十條承攬之規定訂立本契約。`,
      ref: ["民法 §490", "民法 §153"] },
    { n: 2, title: "工作範圍與交付",
      body: `乙方應為甲方完成下列工作：\n{{scope}}\n\n乙方應交付下列成果：\n{{deliverable}}\n\n交付物未載明規格者，應具通常效用及商業上可接受之品質。`,
      ref: ["民法 §490", "民法 §492"] },
    { n: 3, title: "時程",
      body: `乙方應於 {{deadline}} 前完成全部工作並交付甲方驗收，該期限為確定期限，屆期未交付者，乙方自負給付遲延責任。如因甲方協力不足或不可歸責於乙方之事由致無法準時交付者，交付期限順延。`,
      ref: ["民法 §229", "民法 §507"] },
    { n: 4, title: "報酬與里程碑付款",
      body: `本契約之報酬總額為新臺幣 {{amount_chinese}} 元整（NT$ {{amount}}）。\n雙方明示排除民法第五百零五條「完工後一次給付」之預設，報酬依下列里程碑分期給付：{{milestones}}。\n甲方應於各期條件成就後依乙方指定之方式為給付；逾期給付者，乙方得就遲延部分按年息 {{interest_rate}}% 計付遲延利息。`,
      ref: ["民法 §505", "民法 §203", "民法 §233"] },
    { n: 5, title: "定作人協力義務",
      body: `甲方應於合理期間內提供乙方完成工作所需之素材、資訊、權限及回饋。甲方未盡協力義務者，乙方得定相當期限催告；逾期仍不協力者，乙方得依民法第五百零七條解除契約，並就已完成部分請求報酬及賠償因此所受之損害。`,
      ref: ["民法 §507"] },
    { n: 6, title: "變更管理",
      body: `任一方就工作範圍、交付物或時程之變更，應以書面提出。他方應於 {{change_reply_days}} 日內評估其對報酬及時程之影響並回覆，經雙方書面確認後始生效力。未經書面確認之變更，乙方不負履行義務。`,
      ref: ["民法 §506"] },
    { n: 7, title: "驗收",
      body: `甲方應於乙方交付後 {{acceptance_days}} 日內依約定標準完成驗收，逾期未為驗收或未具體指明缺失者，視為驗收通過。驗收發現缺失者，甲方應具體列明，乙方應於 {{fix_days}} 日內無償修補後再行驗收。驗收通過之日為報酬給付及工作危險移轉之時點。`,
      ref: ["民法 §492", "民法 §505", "民法 §508"] },
    { n: 8, title: "瑕疵擔保與保固",
      body: `乙方就其完成之工作負瑕疵擔保責任。自驗收通過之日起 {{warranty_months}} 個月內，乙方應就可歸責於己之瑕疵免費修補；甲方並得依民法第四百九十三條至第四百九十五條行使減少報酬、解除契約或損害賠償等救濟。但因甲方提供之素材、指示或第三人所致之瑕疵，不在此限。\n注意：定作人之瑕疵發見及權利行使有時效限制（民法第四百九十八條、第五百十四條），乙方故意不告知瑕疵者，其免責特約無效（民法第五百零一條之一）。`,
      ref: ["民法 §492", "民法 §493", "民法 §494", "民法 §495", "民法 §498", "民法 §514"] },
    { n: 9, title: "智慧財產權",
      body: v.ip_owner === "a"
        ? `乙方完成之工作成果，其著作財產權及其他智慧財產權，自報酬全額給付完成之日起全部移轉歸甲方所有，乙方應協同辦理一切權利移轉手續。著作人格權不得讓與，乙方同意於甲方依約利用範圍內不行使著作人格權。\n乙方為完成工作所使用之既有著作、開源元件及通用工具元件，其權利仍歸乙方或原權利人所有，乙方就甲方利用工作成果所必要之範圍授權甲方使用。\n乙方保證其交付之成果未侵害任何第三人之智慧財產權或其他權利；如有第三人主張權利，乙方應負責排除並賠償甲方因此所受之損害。`
        : v.ip_owner === "b"
        ? `乙方完成之工作成果，其著作財產權及相關智慧財產權歸乙方所有。乙方就本契約目的範圍內，授予甲方於約定之用途、期間及地域之非專屬授權；授權範圍未約定明確之部分，推定為未授權。`
        : `乙方完成之工作成果，其著作財產權及相關智慧財產權由甲乙雙方共有，任一方利用前應徵得他方書面同意。`,
      ref: ["著作權法 §12", "著作權法 §21", "著作權法 §37"] },
    { n: 10, title: "逾期違約金",
      body: `乙方逾期交付者，每逾一日應按本契約報酬總額之 {{penalty_rate}}% 計付違約金，但違約金總額以本契約報酬之 {{penalty_cap_pct}}% 為上限。本違約金為損害賠償總額之預定，如約定顯失公平，當事人得請求法院酌減。`,
      ref: ["民法 §229", "民法 §250", "民法 §252"] },
    { n: 11, title: "損害賠償與責任上限",
      body: `除因故意、重大過失、侵害他方智慧財產權、違反保密義務或致人身傷害之情形外，任一方依本契約所負之累計損害賠償責任，以本契約報酬總額為上限，且不含間接損害及所失利益。他方與有過失者，得依民法第二百十七條減免賠償。`,
      ref: ["民法 §216", "民法 §217"] },
    { n: 12, title: "保密義務",
      body: `雙方對於因履行本契約而知悉之他方營業秘密、客戶資料及其他非公開資訊，於本契約終止後 三 年內仍負保密義務；其屬營業秘密者，於該營業秘密存續期間持續負保密義務。但已公開、自第三人合法取得或依法令應揭露者，不在此限。`,
      ref: ["營業秘密法 §2"] },
    { n: 13, title: "不可抗力",
      body: `因天災、戰爭、疫病、政府命令等非可歸責於當事人且不可預見之事由致無法履約者，該當事人於該事由存續期間免負遲延或不履行責任，但應即時通知他方並採取合理措施減輕損害。前述事由持續逾 {{fm_days}} 日者，任一方得終止本契約並就已履行部分結算。`,
      ref: ["民法 §225", "民法 §230"] },
    { n: 14, title: "契約終止",
      body: `甲方得依民法第五百十一條於工作完成前隨時終止契約，但應賠償乙方已完成部分之報酬、已投入之必要成本及合理利潤。任一方有重大違約者，他方得定 {{cure_days}} 日期限催告改正，逾期未改正者得解除契約；契約目的因而不能達成者，得逕行解除。契約解除後，雙方互負回復原狀義務。`,
      ref: ["民法 §511", "民法 §254", "民法 §256", "民法 §259"] },
    { n: 15, title: "稅費與發票",
      body: `本契約報酬之含稅 / 未稅應於報價時明示；乙方應依法開立統一發票。涉扣繳者，依所得稅法第八十八條辦理。`,
      ref: [] },
    { n: 16, title: "電子簽署",
      body: `雙方同意本契約以電子文件及電子簽章方式簽署，依電子簽章法第五條，其效力不因屬電子形式而受否認，與紙本簽署具同等法律效力；採電子方式簽署係經雙方合意。系統留存之簽署時間戳記、IP 位址及簽名雜湊值供查驗。如以經許可憑證之數位簽章簽署者，依同法第六條推定為本人親簽且內容未經竄改。`,
      ref: ["電子簽章法 §5", "電子簽章法 §6"] },
    { n: 17, title: "通知",
      body: `本契約之通知應以書面或電子郵件為之，於送達他方時生效；對非對話人之意思表示，於通知到達相對人時發生效力。`,
      ref: ["民法 §94", "民法 §95"] },
    { n: 18, title: "管轄法院",
      body: `因本契約所生爭議，雙方同意以 {{court}} 為第一審管轄法院。`, ref: [] },
    { n: 19, title: "一般條款",
      body: `本契約部分條款無效者，不影響其餘條款之效力。本契約為雙方之完整合意，變更或補充應以書面為之。任一方非經他方書面同意，不得將本契約之權利義務讓與第三人。`,
      ref: ["民法 §111", "民法 §294"] },
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
    { n: 4, title: "保密期間", body: `本協議自雙方簽署之日起生效，保密義務於協議終止後 {{term_years}} 年內繼續有效；其屬營業秘密法所定營業秘密者，於該營業秘密存續期間持續負保密義務，不受前述年限之限制。`, ref: ["營業秘密法 §2"] },
    { n: 5, title: "違約責任", body: `任一方違反本協議者，應賠償他方因此所受之一切損害，並另應給付懲罰性違約金新臺幣 {{penalty}} 元。`, ref: ["民法 §227", "民法 §250"] },
    { n: 6, title: "管轄法院", body: `因本協議所生爭議，雙方同意以 臺灣臺北地方法院 為第一審管轄法院。`, ref: [] },
    { n: 7, title: "電子簽署", body: `雙方合意本協議以電子文件及電子簽章方式簽署，依電子簽章法第五條，其效力不因屬電子形式而受否認，與紙本簽署具同等法律效力；如以經許可憑證之數位簽章簽署者，依同法第六條推定為本人親簽且內容未經竄改。`, ref: ["電子簽章法 §5", "電子簽章法 §6"] },
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
    { n: 3, title: "租金與押金", body: `月租金新臺幣 {{rent}} 元，承租人應於每月 5 日前匯入出租人指定帳戶。押金新臺幣 {{deposit}} 元（依土地法第九十九條，擔保金不得超過二個月租金總額，超過部分承租人得抵付租金），於本契約終止且租賃物返還無瑕疵時，無息返還。`, ref: ["民法 §439", "土地法 §99"] },
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
    { n: 4, title: "瑕疵擔保", body: `出賣人應擔保標的物於危險移轉時無滅失或減少其價值之瑕疵。買受人受領標的物後應從速檢查，發現有應由出賣人負擔保責任之瑕疵時，應即通知出賣人，怠於通知者，除依通常檢查不能發見之瑕疵外，視為承認所受領之物（民法第三百五十六條）。買受人因物有瑕疵而得解除契約或請求減少價金之權利，於物之交付後六個月間，或契約解除後六個月間不行使而消滅（民法第三百六十五條）。`, ref: ["民法 §354", "民法 §356", "民法 §365"] },
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
    footer: "本契約以電子簽章方式簽署，依電子簽章法第 5 條，其效力不因屬電子形式而受否認，與紙本簽署具同等法律效力。",
    disclaimer: "本平台提供之合約模板與條款建議，係依中華民國現行法律一般情形編製，僅供一般參考用途。重大交易、跨境合作或具爭議性事項，建議委請執業律師審閱。",
    generatedAt: new Date().toISOString(),
  };
}
