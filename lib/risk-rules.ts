// Rule-based risk checker for Taiwan-law contracts.
// Each rule scans contract text + structured values and emits a finding with:
//   level: 'red' | 'yellow' | 'green-info'
//   legalBasis: cited statute
//   suggestion: plain-Chinese explanation + revision hint
//
// Design notes:
// - Pure functions. No DB, no LLM. Safe to run server- or client-side.
// - Explanations are *risk prompts*, NOT legal advice. UI must add disclaimer.
// - Rules deliberately err on the cautious side: when in doubt, raise yellow.

export type RiskLevel = "red" | "yellow" | "green-info";

export interface RiskFinding {
  id: string;
  level: RiskLevel;
  title: string;
  detail: string;
  legalBasis: string[];
  suggestion: string;
  referLawyer: boolean;
}

export interface RiskCheckInput {
  templateId: string;
  values: Record<string, string>;
  // Full rendered contract text (joined clauses). Used by keyword rules.
  fullText: string;
}

const num = (v: string | undefined): number | null => {
  if (!v) return null;
  const n = Number(String(v).replace(/[,_\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

type Rule = (i: RiskCheckInput) => RiskFinding | null;

// ----- §205 民法利率 16% 上限（消費借貸） -----
const ruleLoanRateCap: Rule = ({ templateId, values }) => {
  if (templateId !== "loan") return null;
  const rate = num(values.rate);
  if (rate == null) return null;
  if (rate > 16) {
    return {
      id: "loan-rate-over-16",
      level: "red",
      title: `年利率 ${rate}% 超過民法 §205 上限`,
      detail: "民法第 205 條規定，約定利率不得超過年息 16%。超過部分債權人對於超過部分之利息，無請求權。",
      legalBasis: ["民法 §205"],
      suggestion: "請調降至 16% 以下；若實際成本（含手續費）已逾此線，建議改以其他法律關係（如服務報酬）處理。",
      referLawyer: true,
    };
  }
  if (rate > 10) {
    return {
      id: "loan-rate-high",
      level: "yellow",
      title: `年利率 ${rate}% 偏高（接近 §205 上限）`,
      detail: "雖未逾 §205 上限，但年息超過 10% 已屬偏高，於訴訟中法官可能就「過高利息」進行酌減（§206 預扣利息禁止）。",
      legalBasis: ["民法 §205", "民法 §206"],
      suggestion: "建議降至 10% 以下，或於契約中明列利息計算式以避免爭議。",
      referLawyer: false,
    };
  }
  return null;
};

// ----- 違約金過高（法院酌減風險） -----
const rulePenaltyTooHigh: Rule = ({ templateId, values }) => {
  if (templateId !== "freelance") return null;
  const rate = num(values.penalty_rate);
  if (rate == null) return null;
  if (rate > 0.5) {
    return {
      id: "penalty-rate-high",
      level: "red",
      title: `逾期違約金 ${rate}%/日（年化逾 180%）`,
      detail: "逾期違約金每日超過 0.5% 屬偏高，法院依民法 §252 得依職權酌減至相當之數。實務上常見上限為 0.1%–0.3%/日。",
      legalBasis: ["民法 §250", "民法 §252"],
      suggestion: "建議調至 0.1%–0.3%/日，並訂明違約金總額不超過契約報酬之 20%。",
      referLawyer: false,
    };
  }
  return null;
};

// ----- NDA 保密期間過長 / 無限期 -----
const ruleNdaTermUnlimited: Rule = ({ templateId, values }) => {
  if (templateId !== "nda") return null;
  const years = num(values.term_years);
  if (years == null) return null;
  if (years === 0 || years >= 99) {
    return {
      id: "nda-term-unlimited",
      level: "red",
      title: "保密期間 = 永久 / 過長",
      detail: "保密義務無限期或長達數十年，法院常認為違反比例原則而部分無效，且實務舉證困難。",
      legalBasis: ["民法 §247-1", "營業秘密法 §2"],
      suggestion: "建議訂為 3–5 年；涉及客戶名單、技術 know-how 等可至 10 年。",
      referLawyer: false,
    };
  }
  if (years > 10) {
    return {
      id: "nda-term-long",
      level: "yellow",
      title: `保密期間 ${years} 年偏長`,
      detail: "超過 10 年之保密期限，於日後若進入訴訟，相對人可能主張違反比例原則。",
      legalBasis: ["民法 §247-1"],
      suggestion: "若非營業秘密類，建議縮短至 5–10 年。",
      referLawyer: false,
    };
  }
  return null;
};

// ----- 接案合約金額偏大（建議律師審） -----
const ruleHighValueContract: Rule = ({ templateId, values }) => {
  const amount =
    num(values.amount) ?? num(values.price) ?? num(values.salary) ?? num(values.rent) ?? num(values.fee);
  if (amount == null) return null;
  if (amount >= 1_000_000) {
    return {
      id: "high-value",
      level: "yellow",
      title: `契約金額 NT$${amount.toLocaleString()} 屬重大金額`,
      detail: "金額達百萬元以上者，建議由執業律師審閱違約、保證、智慧財產等條款，以降低訴訟風險。",
      legalBasis: [],
      suggestion: "申請律師轉介，或委請熟悉該產業之律師審閱。",
      referLawyer: true,
    };
    void templateId;
  }
  return null;
};

// ----- 勞動契約：工資 / 工時 必檢 -----
const ruleEmploySalaryFloor: Rule = ({ templateId, values }) => {
  if (templateId !== "employ") return null;
  const salary = num(values.salary);
  if (salary == null) return null;
  // 2026 基本工資（占位，實際以勞動部公告為準）
  const MIN_WAGE = 28590;
  if (salary < MIN_WAGE) {
    return {
      id: "employ-below-min-wage",
      level: "red",
      title: `月薪 NT$${salary.toLocaleString()} 低於基本工資`,
      detail: `勞動部公告之基本工資為月薪 NT$${MIN_WAGE.toLocaleString()}（請以最新公告為準）。低於基本工資之約定無效。`,
      legalBasis: ["勞基法 §21"],
      suggestion: `調至 NT$${MIN_WAGE.toLocaleString()} 以上；部分工時應換算最低時薪。`,
      referLawyer: true,
    };
  }
  return null;
};

// ----- 工時上限 -----
const ruleEmployWorkHours: Rule = ({ templateId, values }) => {
  if (templateId !== "employ") return null;
  const hours = num(values.work_hours);
  if (hours == null) return null;
  if (hours > 8) {
    return {
      id: "employ-over-8h",
      level: "red",
      title: `每日工時 ${hours} 小時逾勞基法上限`,
      detail: "勞基法第 30 條規定每日正常工時不得超過 8 小時，每週不得超過 40 小時。超過部分為加班需給付加班費。",
      legalBasis: ["勞基法 §30", "勞基法 §32"],
      suggestion: "改為 8 小時；如有加班需求，另以加班條款及加班費計算式約定。",
      referLawyer: false,
    };
  }
  return null;
};

// ----- 關鍵字掃描：常見高風險寫法 -----
const KEYWORD_RULES: { id: string; pattern: RegExp; finding: Omit<RiskFinding, "id"> }[] = [
  {
    id: "unilateral-termination",
    pattern: /(甲方|本公司).{0,12}得隨時.{0,10}(終止|解除)/,
    finding: {
      level: "yellow",
      title: "單方隨時終止條款",
      detail: "「甲方得隨時終止」屬單方解除權，可能被視為定型化契約之顯失公平條款（消保法 §12）。",
      legalBasis: ["消保法 §12", "民法 §247-1"],
      suggestion: "建議加上「應於 30 日前以書面通知」或「應給付已完成工作之比例報酬」之緩衝條款。",
      referLawyer: false,
    },
  },
  {
    id: "waive-all-claims",
    pattern: /拋棄.{0,8}(一切|所有).{0,8}(請求權|追訴權|抗辯權)/,
    finding: {
      level: "red",
      title: "全面拋棄請求權條款",
      detail: "全面拋棄所有請求權或追訴權，違反公序良俗或顯失公平者無效（民法 §72、§247-1）。",
      legalBasis: ["民法 §72", "民法 §247-1"],
      suggestion: "限縮拋棄範圍至特定事項或金額；保留刑事告訴權、勞動權益、消費者保護法權利。",
      referLawyer: true,
    },
  },
  {
    id: "perpetual-confidentiality",
    pattern: /保密.{0,20}(永久|無限期|終身)/,
    finding: {
      level: "yellow",
      title: "永久保密條款",
      detail: "永久保密義務於非營業秘密類資訊可能被法院認為違反比例原則。",
      legalBasis: ["民法 §247-1", "營業秘密法 §2"],
      suggestion: "訂為 3–10 年；營業秘密類另依營業秘密法保護。",
      referLawyer: false,
    },
  },
  {
    id: "non-compete-no-comp",
    pattern: /(離職|終止).{0,20}競業/,
    finding: {
      level: "yellow",
      title: "離職後競業禁止條款",
      detail: "依勞基法 §9-1，離職後競業禁止須符合：合理範圍、合理期間（不逾 2 年）、合理代償。",
      legalBasis: ["勞基法 §9-1"],
      suggestion: "確認是否約定合理代償（一般為原薪資 50%）與不逾 2 年期間。",
      referLawyer: true,
    },
  },
  {
    id: "foreign-jurisdiction",
    pattern: /(美國|新加坡|香港|英國|日本|韓國).{0,20}(法院|管轄)/,
    finding: {
      level: "red",
      title: "外國管轄條款",
      detail: "約定外國法院為管轄法院，於跨境執行、訴訟成本上對台灣企業極不利。",
      legalBasis: ["涉外民事法律適用法"],
      suggestion: "改為「台灣台北地方法院」為第一審管轄法院；如為跨國交易，建議律師審閱。",
      referLawyer: true,
    },
  },
];

const ruleKeywords: Rule = ({ fullText }) => {
  // returns the first match; collectAll() below also runs all rules
  for (const r of KEYWORD_RULES) {
    if (r.pattern.test(fullText)) return { id: r.id, ...r.finding };
  }
  return null;
};

const ALL_RULES: Rule[] = [
  ruleLoanRateCap,
  rulePenaltyTooHigh,
  ruleNdaTermUnlimited,
  ruleHighValueContract,
  ruleEmploySalaryFloor,
  ruleEmployWorkHours,
];

export function runRiskCheck(input: RiskCheckInput): RiskFinding[] {
  const findings: RiskFinding[] = [];
  for (const r of ALL_RULES) {
    const f = r(input);
    if (f) findings.push(f);
  }
  // Keyword rules: run all (not just first) so multiple red flags surface together
  for (const k of KEYWORD_RULES) {
    if (k.pattern.test(input.fullText)) {
      findings.push({ id: k.id, ...k.finding });
    }
  }
  // Deduplicate by id
  const seen = new Set<string>();
  const unique = findings.filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
  // Sort: red > yellow > green-info
  const order: Record<RiskLevel, number> = { red: 0, yellow: 1, "green-info": 2 };
  return unique.sort((a, b) => order[a.level] - order[b.level]);
}

export function summarizeRisk(findings: RiskFinding[]): {
  level: RiskLevel;
  reds: number;
  yellows: number;
  needsLawyer: boolean;
  oneliner: string;
} {
  const reds = findings.filter((f) => f.level === "red").length;
  const yellows = findings.filter((f) => f.level === "yellow").length;
  const level: RiskLevel = reds > 0 ? "red" : yellows > 0 ? "yellow" : "green-info";
  const needsLawyer = findings.some((f) => f.referLawyer);
  const oneliner =
    level === "red"
      ? `偵測到 ${reds} 項紅燈風險，強烈建議委請律師審閱`
      : level === "yellow"
      ? `偵測到 ${yellows} 項黃燈提示，可自行調整或諮詢律師`
      : "未發現規則式紅旗，仍建議於重要交易前由律師審閱";
  return { level, reds, yellows, needsLawyer, oneliner };
}

// Reference list for unused-prop linters
void ruleKeywords;
