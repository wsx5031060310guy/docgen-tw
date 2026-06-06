import { NextResponse, after } from "next/server";
import { persistSignaturePng } from "@/lib/services/signing_service";
import { recordRecipientSignature } from "@/lib/contract-store";
import { notifyFullySigned } from "@/lib/notify";
import { fireUserWebhook } from "@/lib/webhooks";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

interface SignPayload {
  token: string;
  signature: string; // base64 PNG data URL
  recipientName?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: SignPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.token || !body.signature) {
    return NextResponse.json({ error: "缺少 token 或簽名" }, { status: 400 });
  }

  const sig = await persistSignaturePng(`${id}_recipient`, body.signature);

  const result = await recordRecipientSignature({
    id,
    token: body.token,
    recipientSignatureUrl: sig.url,
    recipientSignatureHash: sig.sha256,
    recipientIp: req.headers.get("x-forwarded-for") ?? "unknown",
    recipientName: body.recipientName,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  // Completion notification (PDF render + Mailgun) and the user webhook are slow
  // and must NOT block the signer's response: awaiting inline overran the function
  // limit on the PDF font fetch and 504'd, while fire-and-forget got frozen at
  // res.end() before Mailgun sent. `after` returns the response immediately and
  // keeps the instance alive until the work finishes (bounded by maxDuration).
  // notifyFullySigned swallows its own errors; the webhook is wrapped here.
  after(async () => {
    await notifyFullySigned(result);

    // Best-effort user webhook (Slack/Discord/n8n/…). Owner uid is on the row.
    try {
      if (!process.env.DATABASE_URL) return;
      const row = await prisma.contract.findUnique({
        where: { id: result.id },
        select: { uid: true },
      });
      if (!row?.uid) return;
      await fireUserWebhook(row.uid, {
        type: "contract.signed.full",
        contractId: result.id,
        templateId: result.templateId,
        senderName: result.client || "—",
        recipientName: result.recipientName ?? null,
      });
    } catch (e) {
      console.error("[recipient-sign] webhook err", (e as Error).message);
    }
  });

  return NextResponse.json({
    id: result.id,
    signingStatus: result.signingStatus,
    recipientSignedAt: result.recipientSignedAt,
  });
}
