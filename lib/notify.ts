// Signed-contract notification: email both parties that signing is complete.
//
// Completion emails include the signed PDF. Previous CFF fonts made fontkit
// subsetting take 60–94s locally and 136–206s in production; local TrueType
// (glyf) fonts remove that bottleneck. A 40s guard and attachment-free fallback
// keep email best-effort if rendering still fails or stalls.

import { sendEmail, mailgunConfigured } from "@/lib/mailgun";
import type { StoredContract } from "@/lib/contract-store";
import { renderCompletionEmail } from "@/lib/email-templates";
import { pdfInputFor } from "@/lib/pdf/input";
import { renderContractPdf } from "@/lib/pdf/render";
import { contractTitle } from "@/lib/templates";

export async function notifyFullySigned(c: StoredContract): Promise<void> {
  // De-dupe: a contract where both parties share an address (or the recipient is
  // also a party) must not get the same email two or three times.
  const recipients = [...new Set(
    [c.recipientEmail, c.values?.party_a_email, c.values?.party_b_email]
      .filter((x): x is string => Boolean(x && x.includes("@"))),
  )];
  if (recipients.length === 0) return;

  // A deployment may intentionally run without email configured. Skip cleanly —
  // signing already succeeded; the completion email is best-effort. Logged at info
  // (not error) so an email-less deployment doesn't raise an error on every signature.
  if (!mailgunConfigured()) {
    console.info("[notify] mailgun not configured — completion email skipped");
    return;
  }

  const tplName = contractTitle(c.templateId, c.values);
  let pdf: Buffer | undefined;
  let pdfTimeout: ReturnType<typeof setTimeout> | undefined;
  try {
    pdf = await Promise.race([
      renderContractPdf(pdfInputFor(c)),
      new Promise<never>((_, reject) => {
        pdfTimeout = setTimeout(
          () => reject(new Error("PDF render timed out after 40 seconds")),
          40_000,
        );
      }),
    ]);
  } catch (reason) {
    console.error("[notify] pdf render failed, sending without attachment:", reason);
  } finally {
    if (pdfTimeout) clearTimeout(pdfTimeout);
  }

  const email = renderCompletionEmail({
    title: tplName,
    contractId: c.id,
    partyA: c.values?.party_a_name || "—",
    partyB: c.values?.party_b_name || c.recipientName || "—",
    signedAt: c.recipientSignedAt ?? c.updatedAt,
    pdfAttached: Boolean(pdf),
  });

  for (const to of recipients) {
    try {
      const r = await sendEmail({
        to,
        subject: email.subject,
        text: email.text,
        html: email.html,
        attachment: pdf
          ? { filename: `docgen-${c.id}.pdf`, data: pdf, contentType: "application/pdf" }
          : undefined,
      });
      if (!r.ok) console.error(`[notify] mailgun failed for ${to}: ${r.reason}`);
    } catch (e) {
      console.error(`[notify] send threw for ${to}:`, (e as Error).message);
    }
  }
}
