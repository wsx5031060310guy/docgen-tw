import type { StoredContract } from "@/lib/contract-store";

type SignFetchBase = {
  id: string;
  templateId: string;
  recipientName: string | null;
  recipientEmail: string | null;
  values: Record<string, string>;
  senderSignatureUrl: string | null;
};

export type SignFetchData =
  | (SignFetchBase & {
      signingStatus: "FULLY_SIGNED";
      recipientSignatureUrl: string | null;
      fullySigned: true;
      recipientSignedAt: string | null;
      senderName?: never;
    })
  | (SignFetchBase & {
      signingStatus: Exclude<StoredContract["signingStatus"], "FULLY_SIGNED">;
      senderName: string;
      recipientSignatureUrl?: never;
      fullySigned?: never;
      recipientSignedAt?: never;
    });

export function buildSignFetchPayload(c: StoredContract): SignFetchData {
  if (c.signingStatus === "FULLY_SIGNED") {
    return {
      id: c.id,
      templateId: c.templateId,
      signingStatus: c.signingStatus,
      values: c.values,
      senderSignatureUrl: c.senderSignatureUrl,
      recipientSignatureUrl: c.recipientSignatureUrl,
      fullySigned: true,
      recipientSignedAt: c.recipientSignedAt?.toISOString() ?? null,
      recipientName: c.recipientName,
      recipientEmail: c.recipientEmail,
    };
  }

  return {
    id: c.id,
    templateId: c.templateId,
    signingStatus: c.signingStatus,
    senderName: c.values.party_a_name || c.client,
    recipientName: c.recipientName,
    recipientEmail: c.recipientEmail,
    values: c.values,
    senderSignatureUrl: c.senderSignatureUrl,
  };
}
