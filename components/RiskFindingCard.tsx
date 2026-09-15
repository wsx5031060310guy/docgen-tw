import { Icon } from "./Icon";
import type { RiskLevel } from "@/lib/risk-rules";

type HeadingLevel = 2 | 3 | 4;

export type RiskFindingCardData = {
  id: string;
  level: RiskLevel;
  title: string;
  detail: string;
  suggestion: string;
  legalBasis: string[];
};

export const RISK_LEVEL_CLASS: Record<RiskLevel, { notice: string; chip: string; icon: string }> = {
  red: { notice: "error", chip: "chip-bad", icon: "alertOctagon" },
  yellow: { notice: "warning", chip: "chip-warn", icon: "alert" },
  "green-info": { notice: "success", chip: "chip-good", icon: "checkCircle" },
};

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  red: "紅燈",
  yellow: "黃燈",
  "green-info": "綠燈",
};

export function RiskFindingCard({
  finding,
  source,
  headingLevel = 3,
}: {
  finding: RiskFindingCardData;
  source?: "ai";
  headingLevel?: HeadingLevel;
}) {
  const style = RISK_LEVEL_CLASS[finding.level];
  const HeadingTag = `h${headingLevel}` as "h2" | "h3" | "h4";

  return (
    <article className={`card dg-risk-finding${source === "ai" ? " dg-risk-finding--ai" : ""}`}>
      <div className="dg-risk-finding__header">
        <span className={`chip ${style.chip} dg-risk-finding__level`}>
          <Icon name={style.icon} size={10} />
          {RISK_LEVEL_LABEL[finding.level]}{source === "ai" ? " · AI" : ""}
        </span>
        <HeadingTag className="dg-risk-finding__title">{finding.title}</HeadingTag>
      </div>
      <p className="dg-risk-finding__detail">{finding.detail}</p>
      {finding.suggestion && (
        <p className="dg-risk-finding__suggestion"><strong>建議：</strong>{finding.suggestion}</p>
      )}
      {finding.legalBasis.length > 0 && (
        <div className="dg-risk-finding__legal" aria-label="相關法條">
          {finding.legalBasis.map((basis) => (
            <span key={basis} className="chip chip-mono dg-risk-finding__basis">{basis}</span>
          ))}
        </div>
      )}
    </article>
  );
}
