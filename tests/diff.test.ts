import { describe, expect, it } from "vitest";
import { diffValues, inlineDiff } from "../lib/diff";

describe("diff", () => {
  it("returns empty array when objects match", () => {
    expect(diffValues({ a: "1", b: "2" }, { a: "1", b: "2" })).toEqual([]);
  });

  it("captures added / removed / changed keys", () => {
    const changes = diffValues({ a: "1", b: "2" }, { b: "3", c: "4" });
    expect(changes).toHaveLength(3);
    expect(changes.find((c) => c.key === "a")).toEqual({ key: "a", before: "1", after: "" });
    expect(changes.find((c) => c.key === "b")).toEqual({ key: "b", before: "2", after: "3" });
    expect(changes.find((c) => c.key === "c")).toEqual({ key: "c", before: "", after: "4" });
  });

  it("inlineDiff isolates the changed middle", () => {
    const d = inlineDiff("年利率 5%", "年利率 12%");
    expect(d.head).toBe("年利率 ");
    expect(d.before).toBe("5");
    expect(d.after).toBe("12");
    expect(d.tail).toBe("%");
  });

  it("inlineDiff handles identical strings", () => {
    const d = inlineDiff("same", "same");
    expect(d.before).toBe("");
    expect(d.after).toBe("");
  });
});
