import { NextResponse } from "next/server";
import { findContractByToken } from "@/lib/contract-store";

export const runtime = "nodejs";

// GET /api/contracts/[id]/sign-fetch?token=… — public, token-authed.
// Returns only the data needed to render the recipient-sign screen.
// Does NOT return sender's signature hash beyond what's already in the PDF.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });

  const c = await findContractByToken(id, token);
  if (!c) return NextResponse.json({ error: "invalid token or contract" }, { status: 404 });

  if (c.signingStatus === "FULLY_SIGNED") {
    return NextResponse.json({
      id: c.id, templateId: c.templateId, signingStatus: c.signingStatus,
      values: c.values, senderSignatureUrl: c.senderSignatureUrl,
      recipientSignatureUrl: c.recipientSignatureUrl, fullySigned: true,
    });
  }

  return NextResponse.json({
    id: c.id,
    templateId: c.templateId,
    signingStatus: c.signingStatus,
    senderName: c.values.party_a_name || c.client,
    recipientName: c.recipientName,
    values: c.values,
    senderSignatureUrl: c.senderSignatureUrl,
  });
}
