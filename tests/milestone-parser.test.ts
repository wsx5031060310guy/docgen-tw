import { describe, expect, it } from "vitest";
import { parsePaymentTermsToMilestones, parseMilestonesFromValues } from "../lib/milestone-parser";

describe("milestone-parser", () => {
  it("splits 30/30/40 signature/midway/final pattern", () => {
    const r = parsePaymentTermsToMilestones({
      paymentTerms: "簽約付 30%，期中付 30%，完工驗收後 14 日內付 40%",
      totalAmount: 120000,
      signDate: new Date("2026-01-01"),
      deadlineDate: new Date("2026-06-30"),
    });
    expect(r.length).toBe(3);
    expect(r[0].title).toMatch(/簽約/);
    expect(r[0].amount).toBe(36000);
    expect(r[2].title).toMatch(/尾款/);
    expect(r[2].amount).toBe(48000);
  });

  it("returns single fallback milestone when no payment_terms", () => {
    const r = parsePaymentTermsToMilestones({
      totalAmount: 50000,
      signDate: new Date("2026-01-01"),
      deadlineDate: new Date("2026-03-01"),
    });
    expect(r.length).toBe(1);
    expect(r[0].amount).toBe(50000);
    expect(r[0].dueDate.toISOString().slice(0, 10)).toBe("2026-03-01");
  });

  it("handles 完工 keyword by anchoring to deadline", () => {
    const r = parsePaymentTermsToMilestones({
      paymentTerms: "完工後一次付 100%",
      totalAmount: 100000,
      signDate: new Date("2026-01-01"),
      deadlineDate: new Date("2026-06-30"),
    });
    expect(r[0].dueDate.toISOString().slice(0, 10)).toBe("2026-06-30");
    expect(r[0].amount).toBe(100000);
  });

  it("parses ROC date format YYY/MM/DD as Minguo year", () => {
    const r = parseMilestonesFromValues({
      amount: "60000",
      sign_date: "115/01/01",
      deadline: "115/04/30",
      payment_terms: "簽約 50%，完工 50%",
    });
    expect(r.length).toBe(2);
    expect(r[1].dueDate.getFullYear()).toBe(2026);
  });

  it("orders milestones by date ascending", () => {
    const r = parsePaymentTermsToMilestones({
      paymentTerms: "完工 60%，簽約 40%", // reversed input
      totalAmount: 100000,
      signDate: new Date("2026-01-01"),
      deadlineDate: new Date("2026-06-30"),
    });
    expect(r.length).toBe(2);
    expect(r[0].dueDate.getTime()).toBeLessThan(r[1].dueDate.getTime());
  });
});
