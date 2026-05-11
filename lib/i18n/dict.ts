// Tiny i18n dictionary, keyed by string id. Add new keys as you go;
// fall-through to zh-Hant when a translation is missing.
// We keep this manual rather than next-intl to avoid the App Router refactor.

export type Locale = "zh-Hant" | "en";
export const LOCALES: Locale[] = ["zh-Hant", "en"];
export const DEFAULT_LOCALE: Locale = "zh-Hant";

type Dict = Record<string, string>;

const ZH_HANT: Dict = {
  // Top nav
  "nav.templates": "模板",
  "nav.check": "風險快檢",
  "nav.new_contract": "建立合約",
  "nav.my_contracts": "我的合約",
  "nav.cases": "案件",
  "nav.pricing": "方案",
  "nav.settings": "設定",
  "nav.start": "開始建立",

  // Footer
  "footer.disclaimer_link": "法律免責 / 律師轉介",
  "footer.contact": "聯絡我們",
  "footer.disclaimer_note": "DocGen TW 為文件自動化與風險提示服務，**不取代執業律師意見**。涉及訴訟、重大金額或客製條款者，請洽合作律師。",

  // Home
  "home.tag": "台灣法律合約 · 自動產生 + 電子簽署",
  "home.headline_pre": "3 分鐘產出",
  "home.headline_italic": "可信",
  "home.headline_post": "合約，附完整法條依據。",
  "home.subhead": "從 10 種常用範本開始（含催款通知書、存證信函草稿），逐欄填入即可產出。每一條款都附中華民國法令引用，雙方電子簽署留存 IP、時間戳與簽名雜湊 ——",
  "home.subhead_emphasis": "比律師快、比範本可信。",
  "home.cta_start": "開始建立合約",
  "home.cta_browse": "瀏覽 10 種範本",
  "home.trust.contracts": "已產出合約",
  "home.trust.laws": "中華民國法令",
  "home.trust.signlaw": "電子簽章法 §4 合規",
  "home.trust.users": "使用者",
  "home.trust.time": "平均完成時間",

  // Check
  "check.tag": "合約風險快檢",
  "check.headline_pre": "把現有合約丟進來，30 秒看出",
  "check.headline_italic": " 紅旗",
  "check.headline_post": "條款。",
  "check.cta": "開始風險檢查",
  "check.placeholder": "把整份合約 / 條款文字直接貼進來，建議至少 200 字以獲得有意義的檢查結果",
  "check.try_sample": "試試範例",
  "check.clear": "清除",
  "check.charcount": "字",
  "check.opt_llm": "AI 補充檢查（Gemini 2.5）",
  "check.opt_share": "產生分享連結（30 天）",
  "check.idle": "檢查結果將顯示於此。所有規則皆引用中華民國現行法令，並提供具體修改建議。",

  // Disclaimer
  "disclaimer.tag": "法律定位",
  "disclaimer.headline_pre": "文件自動化 · 風險提示 ·",
  "disclaimer.headline_italic": "律師轉介",
};

const EN: Dict = {
  "nav.templates": "Templates",
  "nav.check": "Risk Check",
  "nav.new_contract": "New Contract",
  "nav.my_contracts": "My Contracts",
  "nav.cases": "Cases",
  "nav.pricing": "Pricing",
  "nav.settings": "Settings",
  "nav.start": "Get Started",

  "footer.disclaimer_link": "Legal Notice / Lawyer Referral",
  "footer.contact": "Contact",
  "footer.disclaimer_note": "DocGen TW provides document automation and risk hints; we **do not replace licensed counsel**. For litigation, large amounts, or custom clauses, please consult a partner lawyer.",

  "home.tag": "Taiwan-law contracts · auto-drafted + e-signed",
  "home.headline_pre": "Trustworthy contracts in",
  "home.headline_italic": "3 minutes",
  "home.headline_post": ", with full legal citations.",
  "home.subhead": "Start from 10 common templates (incl. dunning notice & certified-mail draft). Fill the fields, get the contract. Every clause cites a Taiwan statute; both parties e-sign with IP, timestamp, and signature hash —",
  "home.subhead_emphasis": " faster than a lawyer, more trustworthy than a template.",
  "home.cta_start": "Start a contract",
  "home.cta_browse": "Browse all 10 templates",
  "home.trust.contracts": "Contracts generated",
  "home.trust.laws": "Statutes referenced",
  "home.trust.signlaw": "Electronic Signatures Act §4",
  "home.trust.users": "Users",
  "home.trust.time": "Average time to finish",

  "check.tag": "Quick contract risk check",
  "check.headline_pre": "Paste a contract, see",
  "check.headline_italic": " red flags",
  "check.headline_post": " in 30 seconds.",
  "check.cta": "Run risk check",
  "check.placeholder": "Paste the full contract text. At least 200 characters recommended for a meaningful check.",
  "check.try_sample": "Try sample",
  "check.clear": "Clear",
  "check.charcount": "chars",
  "check.opt_llm": "AI augmentation (Gemini 2.5)",
  "check.opt_share": "Generate share link (30 days)",
  "check.idle": "Results will appear here. Every rule cites a Taiwan statute and suggests a fix.",

  "disclaimer.tag": "Our position",
  "disclaimer.headline_pre": "Document automation · risk hints ·",
  "disclaimer.headline_italic": "lawyer referral",
};

const DICTS: Record<Locale, Dict> = { "zh-Hant": ZH_HANT, en: EN };

export function t(locale: Locale, key: string): string {
  return DICTS[locale]?.[key] ?? DICTS[DEFAULT_LOCALE][key] ?? key;
}

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}
