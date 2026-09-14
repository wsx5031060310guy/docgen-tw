"use client";
import { Icon } from "./Icon";

type HeadingLevel = 2 | 3 | 4;

export function LegalDisclaimer({
  compact,
  headingLevel,
}: {
  compact?: boolean;
  headingLevel?: HeadingLevel;
}) {
  if (compact)
    return (
      <div className="dg-legal-disclaimer dg-legal-disclaimer--compact">
        <Icon name="alert" size={12} />
        <span>本平台產出之合約僅供一般用途參考，重大或複雜爭議請諮詢執業律師。</span>
      </div>
    );
  const HeadingTag = headingLevel ? (`h${headingLevel}` as "h2" | "h3" | "h4") : null;
  return (
    <div className="dg-notice dg-notice--warning dg-legal-disclaimer">
      <Icon name="fileWarn" size={18} />
      <div className="dg-legal-disclaimer__content">
        {HeadingTag ? (
          <HeadingTag className="dg-legal-disclaimer__title">法律免責聲明</HeadingTag>
        ) : (
          <strong className="dg-legal-disclaimer__title dg-legal-disclaimer__title--inline">法律免責聲明</strong>
        )}
        <p className={HeadingTag ? "dg-legal-disclaimer__copy" : "dg-legal-disclaimer__copy dg-legal-disclaimer__copy--inline"}>
          {!HeadingTag && "　"}DocGen TW 提供
          <b>文件自動化與風險提示</b>，並非執業律師、不取代法律意見。本平台輸出之合約模板與風險檢查結果，
          係依中華民國現行法律一般情形編製，僅供一般參考用途。重大金額、跨境、訴訟或客製條款，
          建議委請<a href="/disclaimer" className="dg-legal-disclaimer__link">合作律師</a>審閱。
          因使用本平台所生之爭議，本平台不負法律責任。
        </p>
      </div>
    </div>
  );
}
