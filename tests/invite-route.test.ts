import { describe, expect, it } from "vitest";
import { buildSignUrl, checkInviteRateLimit } from "@/lib/contract-invite";

describe("contract invite helpers", () => {
  it("builds an encoded signing URL without a duplicate slash", () => {
    expect(buildSignUrl("https://docgen.example/", "contract 1", "a+b/c")).toBe(
      "https://docgen.example/contracts/contract%201/sign?token=a%2Bb%2Fc",
    );
  });

  it("allows five invite attempts per contract each hour", () => {
    const contractId = `invite-test-${crypto.randomUUID()}`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(checkInviteRateLimit(contractId).ok).toBe(true);
    }
    expect(checkInviteRateLimit(contractId).ok).toBe(false);
  });
});
