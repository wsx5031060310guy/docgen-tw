// Heuristic mapping from a free-text contract to the closest DocGen template,
// used by /check to offer a "rewrite with our template" CTA.
// Pure keyword tallying — good enough for "did the user paste a loan agreement?"

import { TEMPLATES, type Template } from "./templates";

interface Match {
  templateId: string;
  score: number;
  reason: string;
}

const RULES: { templateId: string; keywords: RegExp[]; label: string }[] = [
  {
    templateId: "loan",
    label: "消費借貸契約",
    keywords: [
      /借款|借貸|貸款/g, /利率|年息|月息/g, /還款|攤還|清償/g, /本金/g,
    ],
  },
  {
    templateId: "employ",
    label: "勞動契約",
    keywords: [
      /勞工|員工|聘僱|雇主/g, /薪資|月薪|時薪|加班費/g, /工時|休假|特休|資遣/g, /勞動基準法|勞基法/g,
    ],
  },
  {
    templateId: "lease",
    label: "租賃契約",
    keywords: [
      /租賃|出租|承租|租客/g, /房東|押金|租金/g, /租期|續租/g,
    ],
  },
  {
    templateId: "nda",
    label: "保密協議",
    keywords: [
      /保密|機密|營業秘密/g, /揭露|不得對外|不得告知/g, /NDA/gi,
    ],
  },
  {
    templateId: "consign",
    label: "委任契約",
    keywords: [
      /委任|受任/g, /處理事務|代理|代辦/g,
    ],
  },
  {
    templateId: "sale",
    label: "買賣契約",
    keywords: [
      /買賣|出賣|買受/g, /價金|貨款|交付/g, /瑕疵擔保/g,
    ],
  },
  {
    templateId: "freelance",
    label: "承攬 / 接案合約",
    keywords: [
      /承攬|外包|接案|專案/g, /設計|開發|交付物/g, /智慧財產|著作權/g,
    ],
  },
  {
    templateId: "dunning",
    label: "催款通知書",
    keywords: [
      /催告|催款|逾期未給付|遲延給付/g,
    ],
  },
  {
    templateId: "cert-mail",
    label: "存證信函",
    keywords: [
      /存證信函|郵政存證/g, /主旨[：:].{0,40}說明/g,
    ],
  },
];

export interface TemplateSuggestion {
  templateId: string;
  template: Template;
  score: number;
  reasonMatches: string[];
}

export function suggestTemplate(fullText: string): TemplateSuggestion | null {
  if (!fullText.trim()) return null;
  const matches: Match[] = RULES.map((r) => {
    let score = 0;
    const reasonMatches: string[] = [];
    for (const re of r.keywords) {
      const m = fullText.match(re);
      if (m && m.length > 0) {
        score += m.length;
        reasonMatches.push(`${re.source.split("|")[0]} × ${m.length}`);
      }
    }
    return { templateId: r.templateId, score, reason: reasonMatches.join("、") };
  }).filter((m) => m.score > 0);

  if (matches.length === 0) return null;
  matches.sort((a, b) => b.score - a.score);
  const top = matches[0];
  const tpl = TEMPLATES.find((t) => t.id === top.templateId);
  if (!tpl) return null;
  return {
    templateId: top.templateId,
    template: tpl,
    score: top.score,
    reasonMatches: top.reason ? top.reason.split("、") : [],
  };
}
