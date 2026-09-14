import type { StoredContract } from "@/lib/contract-store";
import type { PdfInput } from "@/lib/pdf/render";

export function pdfInputFor(c: StoredContract): PdfInput {
  return {
    contractId: c.id,
    templateId: c.templateId,
    values: c.values,
    senderSignatureUrl: c.senderSignatureUrl,
    recipientSignatureUrl: c.recipientSignatureUrl,
    senderAudit: c.senderSignedAt
      ? `${c.senderSignedAt.toISOString().slice(0, 19).replace("T", " ")}　IP ${c.senderIp || "?"}　#${(c.senderSignatureHash || "").slice(0, 8)}`
      : null,
    recipientAudit: c.recipientSignedAt
      ? `${c.recipientSignedAt.toISOString().slice(0, 19).replace("T", " ")}　IP ${c.recipientIp || "?"}　#${(c.recipientSignatureHash || "").slice(0, 8)}`
      : null,
  };
}
