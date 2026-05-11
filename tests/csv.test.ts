import { describe, expect, it } from "vitest";
import { toCsv } from "../lib/csv";

describe("csv", () => {
  it("includes UTF-8 BOM", () => {
    const csv = toCsv([{ a: "1" }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("quotes fields containing commas + quotes", () => {
    const csv = toCsv([{ a: 'has,comma', b: 'has "quote"' }]);
    expect(csv).toContain('"has,comma"');
    expect(csv).toContain('"has ""quote"""');
  });

  it("serializes nested objects as JSON", () => {
    const csv = toCsv([{ a: { x: 1 } }]);
    expect(csv).toContain('"{""x"":1}"');
  });
});
