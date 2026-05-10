import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { buildContractDocument } from "@/lib/contract-engine";
import { persistSignaturePng } from "@/lib/services/signing_service";
import { createContract } from "@/lib/contract-store";

interface CreateContractPayload {
  templateId: string;
  values: Record<string, string | number | boolean>;
  partyASignature: string; // base64 PNG data URL — sender signs at creation
  recipientName?: string;
  recipientEmail?: string;
}

export async function POST(req: Request) {
  let body: CreateContractPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { templateId, values, partyASignature, recipientName, recipientEmail } = body;
  if (!templateId || !values || !partyASignature) {
    return NextResponse.json({ error: "缺少必要欄位（範本/欄位/甲方簽名）" }, { status: 400 });
  }

  let document;
  try {
    document = buildContractDocument(templateId, values);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  // Persist sender signature image, hash for audit
  const tempId = crypto.randomBytes(8).toString("hex");
  const sigRecord = await persistSignaturePng(tempId, partyASignature);

  const stored = await createContract({
    templateId,
    client: typeof values.甲方 === "string" ? values.甲方 : (values.乙方 as string) ?? "",
    content: [document.title, ...document.clauses, document.footer].join("\n\n"),
    senderSignatureUrl: sigRecord.url,
    senderSignatureHash: sigRecord.sha256,
    senderIp: req.headers.get("x-forwarded-for") ?? "unknown",
    recipientName: recipientName ?? null,
    recipientEmail: recipientEmail ?? null,
  });

  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const recipientSignUrl = `${origin}/contracts/${stored.id}/sign?token=${stored.signingToken}`;

  return NextResponse.json(
    {
      id: stored.id,
      document,
      signingStatus: stored.signingStatus,
      recipientSignUrl,
    },
    { status: 201 }
  );
}
