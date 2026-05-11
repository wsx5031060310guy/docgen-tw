// Risk rules that work on raw contract text (no template id, no structured values).
// Used by /check (paste-your-contract) tool. Re-uses the keyword regexes from
// risk-rules.ts plus a few text-only heuristics (amount > 1M detection,
// foreign-jurisdiction, lacking 管轄法院, etc.).

import { runRiskCheck, type RiskFinding, summarizeRisk } from "./risk-rules";

export function runTextOnlyRiskCheck(fullText: string): RiskFinding[] {
  // Reuse keyword rules via runRiskCheck — pass a dummy templateId so structured
  // rules silently no-op, only keyword rules fire on fullText.
  const base = runRiskCheck({ templateId: "__text__", values: {}, fullText });

  const extra: RiskFinding[] = [];

  // Detect "missing 管轄法院" — a frequent omission in homemade contracts.
  if (!/管轄|法院/.test(fullText)) {
    extra.push({
      id: "missing-jurisdiction",
      level: "yellow",
      title: "未約定管轄法院",
      detail: "合約未指明發生爭議時之第一審管轄法院。如未約定，依民事訴訟法第 1 條由被告住所地法院管轄，可能對你不利。",
      legalBasis: ["民事訴訟法 §1", "民事訴訟法 §24"],
      suggestion: "建議加入「因本契約所生爭議，雙方同意以 台灣台北地方法院 為第一審管轄法院」之條款。",
      referLawyer: false,
    });
  }

  // Big numbers ≥ 1,000,000 anywhere → high-value flag.
  const numMatch = fullText.match(/\b(\d{1,3}(?:,\d{3})+|\d{7,})\b/);
  if (numMatch) {
    const n = Number(numMatch[1].replace(/,/g, ""));
    if (n >= 1_000_000) {
      extra.push({
        id: "high-value-text",
        level: "yellow",
        title: `偵測到 NT$${n.toLocaleString()} 之金額`,
        detail: "百萬元以上之契約建議由執業律師審閱違約、保證、智慧財產等條款，以降低訴訟風險。",
        legalBasis: [],
        suggestion: "申請律師轉介，或委請熟悉該產業之律師審閱。",
        referLawyer: true,
      });
    }
  }

  // Detect missing 違約 / 違約金 clause — common in informal contracts.
  if (!/違約|罰款|罰金|損害賠償/.test(fullText)) {
    extra.push({
      id: "missing-penalty",
      level: "yellow",
      title: "未約定違約或損害賠償條款",
      detail: "合約未明列違約責任時，僅能依民法 §227 之一般給付不能 / 不完全給付請求損害賠償，舉證較困難。",
      legalBasis: ["民法 §227", "民法 §250"],
      suggestion: "加入違約金條款（建議 0.1–0.3%/日 + 總額上限）或明列損害賠償計算方式。",
      referLawyer: false,
    });
  }

  // Detect lacking 雙方簽署 clause for written contracts
  if (fullText.length > 200 && !/簽署|簽章|簽名|蓋章/.test(fullText)) {
    extra.push({
      id: "missing-signature-clause",
      level: "yellow",
      title: "未提及簽署 / 簽章方式",
      detail: "合約未明定簽署 / 蓋章方式，可能影響成立要件之認定。",
      legalBasis: ["民法 §3", "電子簽章法 §4"],
      suggestion: "明列：本契約一式二份，雙方簽署後各執一份為憑；或約定電子簽章方式（電子簽章法 §4）。",
      referLawyer: false,
    });
  }

  // Combine and dedup
  const all = [...base, ...extra];
  const seen = new Set<string>();
  return all
    .filter((f) => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    })
    .sort((a, b) => {
      const order: Record<string, number> = { red: 0, yellow: 1, "green-info": 2 };
      return order[a.level] - order[b.level];
    });
}

export { summarizeRisk };
