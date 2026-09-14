import { describe, expect, it } from "vitest";
import { contractTitle } from "@/lib/templates";

describe("contractTitle", () => {
  it("uses a custom contract title", () => {
    expect(contractTitle("custom", { title: "  社群廣告代操服務契約書  " })).toBe(
      "社群廣告代操服務契約書",
    );
  });

  it.each([undefined, { title: "" }, { title: "   " }])(
    "falls back to the custom template name for %j",
    (values) => {
      expect(contractTitle("custom", values)).toBe("自訂模板");
    },
  );

  it("ignores title for non-custom templates", () => {
    expect(contractTitle("freelance", { title: "x" })).toBe("接案 / 承攬合約");
  });

  it("falls back for an unknown template", () => {
    expect(contractTitle("unknown", { title: "x" })).toBe("電子合約");
  });
});
