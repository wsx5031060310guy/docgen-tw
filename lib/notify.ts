// Best-effort signed-contract notification: render PDF once, email both parties
// with the PDF attached. Failures are swallowed and logged — never block the
// signing flow on email delivery.

import { sendEmail } from "@/lib/mailgun";
import { renderContractPdf } from "@/lib/pdf/render";
import type { StoredContract } from "@/lib/contract-store";
import { getTemplate } from "@/lib/templates";

export async function notifyFullySigned(c: StoredContract): Promise<void> {
  const recipients = [c.recipientEmail, c.values?.party_a_email, c.values?.party_b_email]
    .filter((x): x is string => Boolean(x && x.includes("@")));
  if (recipients.length === 0) return;

  const tpl = getTemplate(c.templateId);
  const tplName = tpl?.name || "電子合約";

  let pdfBuf: Buffer | null = null;
  try {
    pdfBuf = await renderContractPdf({
      contractId: c.id,
      templateId: c.templateId,
      values: c.values,
      senderSignatureUrl: c.senderSignatureUrl,
      recipientSignatureUrl: c.recipientSignatureUrl,
      senderAudit: c.senderSignedAt
        ? `${c.senderSignedAt.toISOString().slice(0, 19).replace("T", " ")} IP ${c.senderIp || "?"} #${(c.senderSignatureHash || "").slice(0, 8)}`
        : null,
      recipientAudit: c.recipientSignedAt
        ? `${c.recipientSignedAt.toISOString().slice(0, 19).replace("T", " ")} IP ${c.recipientIp || "?"} #${(c.recipientSignatureHash || "").slice(0, 8)}`
        : null,
    });
  } catch (e) {
    console.error("[notify] pdf render failed:", (e as Error).message);
  }

  for (const to of recipients) {
    try {
      const r = await sendEmail({
        to,
        subject: `[DocGen TW] ${tplName} 已雙方簽署完成`,
        text:
          `${tplName} 已由甲乙雙方完成電子簽署。\n\n` +
          `合約編號：${c.id}\n` +
          `甲方：${c.values?.party_a_name || "—"}\n` +
          `乙方：${c.values?.party_b_name || c.recipientName || "—"}\n` +
          `簽署狀態：FULLY_SIGNED\n\n` +
          `本通知附上完整契約 PDF，依電子簽章法 §4、§9 與紙本具同等效力。\n` +
          `本郵件由 DocGen TW 系統自動發送。`,
        attachment: pdfBuf
          ? { filename: `docgen-${c.id}.pdf`, data: pdfBuf, contentType: "application/pdf" }
          : undefined,
      });
      if (!r.ok) console.error(`[notify] mailgun failed for ${to}: ${r.reason}`);
    } catch (e) {
      console.error(`[notify] send threw for ${to}:`, (e as Error).message);
    }
  }
}
