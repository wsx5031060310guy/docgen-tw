import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit } from "../lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    // wipe the global map between tests
    (globalThis as unknown as { __docgenRateBuckets?: Map<string, unknown> })
      .__docgenRateBuckets = new Map();
  });

  it("allows up to the limit, then blocks", () => {
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit("k1", 5);
      expect(r.ok).toBe(true);
      expect(r.remaining).toBe(4 - i);
    }
    const blocked = checkRateLimit("k1", 5);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });

  it("isolates buckets by key", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("a", 5);
    const otherKey = checkRateLimit("b", 5);
    expect(otherKey.ok).toBe(true);
  });

  it("recovers after window passes", () => {
    // Simulate by tampering with the global map directly
    const m = (globalThis as unknown as { __docgenRateBuckets: Map<string, { timestamps: number[] }> }).__docgenRateBuckets;
    m.set("k2", { timestamps: [Date.now() - 70_000, Date.now() - 65_000] });
    const r = checkRateLimit("k2", 5);
    expect(r.ok).toBe(true);
    expect(r.remaining).toBeGreaterThan(3);
  });
});
