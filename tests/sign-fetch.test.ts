import { afterEach, describe, expect, it, vi } from "vitest";
import { createContract, recordRecipientSignature } from "@/lib/contract-store";
import { buildSignFetchPayload } from "@/lib/sign-fetch";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildSignFetchPayload", () => {
  it("returns the recipient signing payload before and after signing", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const contract = await createContract({
      templateId: "freelance",
      values: { party_a_name: "甲方公司", project_name: "網站建置" },
      client: "甲方公司",
      content: "contract",
      senderSignatureUrl: "sender-signature",
      senderSignatureHash: "sender-hash",
      senderIp: "127.0.0.1",
      recipientEmail: "recipient@example.com",
    });

    const pending = buildSignFetchPayload(contract);
    expect(pending).toMatchObject({
      recipientEmail: "recipient@example.com",
      values: contract.values,
      senderSignatureUrl: "sender-signature",
    });
    expect(pending).not.toHaveProperty("recipientSignatureUrl");

    const signed = await recordRecipientSignature({
      id: contract.id,
      token: contract.signingToken,
      recipientSignatureUrl: "recipient-signature",
      recipientSignatureHash: "recipient-hash",
      recipientIp: "1.1.1.1",
    });
    if ("error" in signed) throw new Error(signed.error);

    expect(buildSignFetchPayload(signed)).toMatchObject({
      fullySigned: true,
      recipientSignedAt: expect.any(String),
    });
  });
});
