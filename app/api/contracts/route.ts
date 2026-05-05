import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { buildContractDocument } from "@/lib/contract-engine";

interface CreateContractPayload {
  templateId: string;
  values: Record<string, string | number | boolean>;
  partyASignature: string;
  partyBSignature: string;
}

export async function POST(req: Request) {
  let body: CreateContractPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { templateId, values, partyASignature, partyBSignature } = body;
  if (!templateId || !values || !partyASignature || !partyBSignature) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  let document;
  try {
    document = buildContractDocument(templateId, values);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const id = crypto.randomBytes(8).toString("hex");
  const auditTrail = {
    contractId: id,
    templateId,
    signedAt: new Date().toISOString(),
    ip: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "unknown",
    signatureHashA: crypto.createHash("sha256").update(partyASignature).digest("hex"),
    signatureHashB: crypto.createHash("sha256").update(partyBSignature).digest("hex"),
  };

  return NextResponse.json({ id, document, auditTrail }, { status: 201 });
}
