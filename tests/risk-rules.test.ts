import { describe, expect, it } from "vitest";
import { runRiskCheck, summarizeRisk } from "../lib/risk-rules";

describe("risk-rules", () => {
  it("flags loan rate above §205 16% cap as red", () => {
    const f = runRiskCheck({
      templateId: "loan",
      values: { rate: "18" },
      fullText: "年利率 18%",
    });
    expect(f.some((x) => x.id === "loan-rate-over-16")).toBe(true);
    expect(f.find((x) => x.id === "loan-rate-over-16")!.level).toBe("red");
  });

  it("flags loan rate 10–16% as yellow", () => {
    const f = runRiskCheck({
      templateId: "loan",
      values: { rate: "12" },
      fullText: "",
    });
    expect(f.find((x) => x.id === "loan-rate-high")?.level).toBe("yellow");
  });

  it("does not flag loan rate ≤10%", () => {
    const f = runRiskCheck({
      templateId: "loan",
      values: { rate: "5" },
      fullText: "",
    });
    expect(f).toEqual([]);
  });

  it("flags NDA term=0 as unlimited", () => {
    const f = runRiskCheck({
      templateId: "nda",
      values: { term_years: "0" },
      fullText: "",
    });
    expect(f.find((x) => x.id === "nda-term-unlimited")?.level).toBe("red");
  });

  it("flags employ work hours > 8 as red", () => {
    const f = runRiskCheck({
      templateId: "employ",
      values: { work_hours: "10", salary: "40000" },
      fullText: "",
    });
    expect(f.find((x) => x.id === "employ-over-8h")?.level).toBe("red");
  });

  it("catches foreign-jurisdiction keyword", () => {
    const f = runRiskCheck({
      templateId: "custom",
      values: {},
      fullText: "因本契約所生爭議由美國加州法院管轄",
    });
    expect(f.find((x) => x.id === "foreign-jurisdiction")?.level).toBe("red");
  });

  it("summarizes empty findings as green-info", () => {
    const s = summarizeRisk([]);
    expect(s.level).toBe("green-info");
    expect(s.needsLawyer).toBe(false);
  });

  it("summarizes red findings as red + needsLawyer", () => {
    const f = runRiskCheck({
      templateId: "loan",
      values: { rate: "20" },
      fullText: "",
    });
    const s = summarizeRisk(f);
    expect(s.level).toBe("red");
    expect(s.needsLawyer).toBe(true);
  });
});
