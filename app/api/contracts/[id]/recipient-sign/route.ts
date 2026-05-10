import { NextResponse } from "next/server";
import { persistSignaturePng } from "@/lib/services/signing_service";
import { recordRecipientSignature } from "@/lib/contract-store";
import { notifyFullySigned } from "@/lib/notify";

export const runtime = "nodejs";

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

  // Best-effort: PDF + email both parties. Don't block the response on it.
  notifyFullySigned(result).catch((e) =>
    console.error("[recipient-sign] notify failed:", (e as Error).message),
  );

  return NextResponse.json({
    id: result.id,
    signingStatus: result.signingStatus,
    recipientSignedAt: result.recipientSignedAt,
  });
}
