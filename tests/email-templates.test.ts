import { describe, expect, it } from "vitest";
import { renderCompletionEmail, renderInviteEmail } from "@/lib/email-templates";

describe("email templates", () => {
  it("renders invite HTML and plain text", () => {
    const email = renderInviteEmail({
      title: "網站設計承攬契約",
      senderName: "王小明",
      recipientName: "陳小華",
      signUrl: "https://docgen.example/contracts/abc/sign?token=secret",
      expiresNote: "請於 2026/9/30 前完成簽署。",
    });

    expect(email.subject).toBe("[DocGen TW] 王小明 邀請你簽署「網站設計承攬契約」");
    expect(email.html).toContain("網站設計承攬契約");
    expect(email.html).toContain("https://docgen.example/contracts/abc/sign?token=secret");
    expect(email.html).toContain("前往閱讀並簽署");
    expect(email.text).not.toMatch(/<[^>]+>/);
  });

  it("renders completion HTML and plain text", () => {
    const email = renderCompletionEmail({
      title: "網站設計承攬契約",
      contractId: "contract-123",
      partyA: "王小明",
      partyB: "陳小華",
      signedAt: "2026-09-15T08:00:00.000Z",
    });

    expect(email.html).toContain("網站設計承攬契約");
    expect(email.html).toContain("contract-123");
    expect(email.text).toContain("簽署狀態：FULLY_SIGNED");
    expect(email.text).not.toMatch(/<[^>]+>/);
  });
});
