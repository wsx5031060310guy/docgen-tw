import { describe, expect, it } from "vitest";
import { runTextOnlyRiskCheck } from "../lib/risk-rules-text";

describe("risk-rules-text", () => {
  it("flags missing jurisdiction clause", () => {
    const f = runTextOnlyRiskCheck("甲方乙方同意以本契約為準，違約者賠償損失。");
    expect(f.some((x) => x.id === "missing-jurisdiction")).toBe(true);
  });

  it("does NOT flag missing jurisdiction when 法院 present", () => {
    const f = runTextOnlyRiskCheck("因本契約所生爭議以台灣台北地方法院為管轄。");
    expect(f.some((x) => x.id === "missing-jurisdiction")).toBe(false);
  });

  it("flags missing penalty when no 違約 or 損害賠償", () => {
    const f = runTextOnlyRiskCheck("甲方乙方就 logo 設計達成協議，由台北地方法院管轄。");
    expect(f.some((x) => x.id === "missing-penalty")).toBe(true);
  });

  it("flags NT$1M+ amount via comma format", () => {
    const f = runTextOnlyRiskCheck("本契約報酬為新台幣 1,200,000 元整。由台北地方法院管轄。違約者賠償。");
    expect(f.find((x) => x.id === "high-value-text")?.level).toBe("yellow");
  });

  it("inherits keyword rule for foreign jurisdiction", () => {
    const f = runTextOnlyRiskCheck("本契約由美國加州法院管轄。");
    expect(f.some((x) => x.id === "foreign-jurisdiction")).toBe(true);
  });

  it("inherits perpetual confidentiality keyword rule", () => {
    const f = runTextOnlyRiskCheck("雙方應保密相關資訊永久，違約賠償損失，由台北地方法院管轄。");
    expect(f.some((x) => x.id === "perpetual-confidentiality")).toBe(true);
  });
});
