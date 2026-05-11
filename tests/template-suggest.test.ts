import { describe, expect, it } from "vitest";
import { suggestTemplate } from "../lib/template-suggest";

describe("template-suggest", () => {
  it("maps loan keywords to loan template", () => {
    const s = suggestTemplate("甲方借款新台幣 100 萬元，年利率 5%，借款期間 12 個月，按月還款。");
    expect(s?.templateId).toBe("loan");
  });

  it("maps employment keywords to employ template", () => {
    const s = suggestTemplate("勞工每日工時 8 小時，月薪 NT$40,000，雇主應依勞動基準法給付加班費。");
    expect(s?.templateId).toBe("employ");
  });

  it("maps lease keywords to lease template", () => {
    const s = suggestTemplate("出租人將房屋出租給承租人，每月租金 25,000，押金 2 月，租期 1 年。");
    expect(s?.templateId).toBe("lease");
  });

  it("maps NDA keywords to nda template", () => {
    const s = suggestTemplate("雙方應對機密資訊負保密義務，不得對外揭露任何營業秘密。");
    expect(s?.templateId).toBe("nda");
  });

  it("returns null for empty text", () => {
    expect(suggestTemplate("")).toBeNull();
    expect(suggestTemplate("   ")).toBeNull();
  });

  it("returns null when no rules match", () => {
    expect(suggestTemplate("今天天氣很好。")).toBeNull();
  });
});
