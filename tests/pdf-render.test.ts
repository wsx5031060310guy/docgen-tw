import { performance } from "node:perf_hooks";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderContractPdf } from "@/lib/pdf/render";
import { wrapLines } from "@/lib/pdf/wrap";
// @ts-expect-error fontkit 2.0.4 does not publish TypeScript declarations.
import * as fontkit from "fontkit";

vi.setConfig({ testTimeout: 15_000 });

const serif = fontkit.openSync(path.join(process.cwd(), "lib/pdf/fonts/NotoSerifTC.ttf"));
const width = (text: string, fontSize: number) =>
  (serif.layout(text).advanceWidth / serif.unitsPerEm) * fontSize;

describe("wrapLines", () => {
  it("wraps Chinese text within the measured width and observes kinsoku rules", () => {
    const text = "甲方「聖索科技有限公司」與乙方「東和樂器木業股份有限公司桃園分公司」訂立本契約，雙方同意遵守下列各條規定。";
    const lines = wrapLines(text, { font: "serif", fontSize: 11, maxWidth: 457 });

    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines.every((line) => width(line, 11) <= 457)).toBe(true);
    expect(lines.every((line) => !"，。；：、）」".includes(line[0] ?? ""))).toBe(true);
    expect(lines.every((line) => !"（「".includes(line.at(-1) ?? ""))).toBe(true);
    expect(lines.join("")).toBe(text);
  });

  it("preserves explicit newlines as hard line breaks", () => {
    expect(wrapLines("  第一行\n 第二行", { font: "serif", fontSize: 11, maxWidth: 457 }))
      .toEqual(["第一行", "第二行"]);
  });
});

describe("renderContractPdf", () => {
  it("renders a long Chinese custom contract with local TrueType fonts", async () => {
    const body = "測試內容，".repeat(760).match(/.{1,200}/gu)?.join("\n") ?? "";
    const startedAt = performance.now();
    const pdf = await renderContractPdf({
      contractId: "performance-test",
      templateId: "custom",
      values: {
        title: "效能測試契約",
        body,
        party_a_name: "甲方測試公司",
        party_b_name: "乙方測試公司",
      },
      senderSignatureUrl: null,
      recipientSignatureUrl: null,
    });
    const elapsedMs = performance.now() - startedAt;

    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(elapsedMs).toBeLessThan(10_000);
  });
});
