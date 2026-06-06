// Signed-contract notification: email both parties that signing is complete.
//
// The contract PDF is intentionally NOT rendered or attached here. @react-pdf's
// CJK render is CPU-bound and blocked the serverless function past its limit, so
// the completion email never sent (the function timed out mid-render). The signed
// PDF stays available on demand via GET /api/contracts/[id]/pdf. Keeping this path
// render-free makes the completion email fast and reliable. Failures are swallowed
// and logged — signing never blocks on email delivery.

import { sendEmail } from "@/lib/mailgun";
import type { StoredContract } from "@/lib/contract-store";
import { getTemplate } from "@/lib/templates";

export async function notifyFullySigned(c: StoredContract): Promise<void> {
  // De-dupe: a contract where both parties share an address (or the recipient is
  // also a party) must not get the same email two or three times.
  const recipients = [...new Set(
    [c.recipientEmail, c.values?.party_a_email, c.values?.party_b_email]
      .filter((x): x is string => Boolean(x && x.includes("@"))),
  )];
  if (recipients.length === 0) return;

  const tpl = getTemplate(c.templateId);
  const tplName = tpl?.name || "電子合約";

  const text =
    `${tplName} 已由甲乙雙方完成電子簽署。\n\n` +
    `合約編號：${c.id}\n` +
    `甲方：${c.values?.party_a_name || "—"}\n` +
    `乙方：${c.values?.party_b_name || c.recipientName || "—"}\n` +
    `簽署狀態：FULLY_SIGNED\n\n` +
    `完整契約 PDF 可至 DocGen TW 合約頁面下載，依電子簽章法 §4、§9 與紙本具同等效力。\n` +
    `本郵件由 DocGen TW 系統自動發送。`;

  for (const to of recipients) {
    try {
      const r = await sendEmail({
        to,
        subject: `[DocGen TW] ${tplName} 已雙方簽署完成`,
        text,
      });
      if (!r.ok) console.error(`[notify] mailgun failed for ${to}: ${r.reason}`);
    } catch (e) {
      console.error(`[notify] send threw for ${to}:`, (e as Error).message);
    }
  }
}
