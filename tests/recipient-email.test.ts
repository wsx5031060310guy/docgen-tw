import { afterEach, describe, expect, it, vi } from "vitest";
import { createContract, recordRecipientSignature } from "@/lib/contract-store";
import { isValidEmail } from "@/lib/email";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isValidEmail", () => {
  it.each([
    ["a@b.co", true],
    ["", false],
    ["a@b", false],
    ["a b@c.com", false],
    [`${"a".repeat(250)}@b.co`, false],
  ])("validates %j", (email, expected) => {
    expect(isValidEmail(email)).toBe(expected);
  });
});

describe("recipient email persistence", () => {
  it("stores a supplied email and preserves an existing email", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const first = await createContract({
      templateId: "test",
      values: {},
      client: "sender",
      content: "contract",
      senderSignatureUrl: "sender-signature",
      senderSignatureHash: "sender-hash",
      senderIp: "127.0.0.1",
    });
    const signedFirst = await recordRecipientSignature({
      id: first.id,
      token: first.signingToken,
      recipientSignatureUrl: "x",
      recipientSignatureHash: "y",
      recipientIp: "1.1.1.1",
      recipientEmail: "client@example.com",
    });

    expect("error" in signedFirst).toBe(false);
    if ("error" in signedFirst) throw new Error(signedFirst.error);
    expect(signedFirst.recipientEmail).toBe("client@example.com");
    expect(signedFirst.signingStatus).toBe("FULLY_SIGNED");

    const second = await createContract({
      templateId: "test",
      values: {},
      client: "sender",
      content: "contract",
      senderSignatureUrl: "sender-signature",
      senderSignatureHash: "sender-hash",
      senderIp: "127.0.0.1",
      recipientEmail: "given@x.com",
    });
    const signedSecond = await recordRecipientSignature({
      id: second.id,
      token: second.signingToken,
      recipientSignatureUrl: "x",
      recipientSignatureHash: "y",
      recipientIp: "1.1.1.1",
    });

    expect("error" in signedSecond).toBe(false);
    if ("error" in signedSecond) throw new Error(signedSecond.error);
    expect(signedSecond.recipientEmail).toBe("given@x.com");
    expect(signedSecond.signingStatus).toBe("FULLY_SIGNED");
  });
});
