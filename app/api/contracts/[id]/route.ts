import { NextResponse } from "next/server";
import { readUidFromRequest } from "@/lib/billing";
import { findContractById } from "@/lib/contract-store";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/contracts/[id] — fetch contract + milestones + case linkage.
// Owner only (signed uid cookie); the recipient uses /sign-fetch with the token.
// Sensitive signing data (signatures, IPs) is returned as hashes/short-forms only.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const c = await findContractById(id);
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (c.uid !== uid) return NextResponse.json({ error: "not your contract" }, { status: 403 });

  let milestones: unknown[] = [];
  let caseInfo: unknown = null;
  if (process.env.DATABASE_URL) {
    milestones = await prisma.milestone.findMany({
      where: { contractId: id },
      orderBy: { dueDate: "asc" },
    });
    const row = await prisma.contract.findUnique({
      where: { id },
      select: { caseId: true, case: { select: { id: true, title: true, status: true } } },
    });
    caseInfo = row?.case ?? null;
  }

  return NextResponse.json({
    contract: {
      id: c.id,
      templateId: c.templateId,
      values: c.values,
      signingStatus: c.signingStatus,
      senderName: c.values?.party_a_name || c.client,
      recipientName: c.recipientName,
      recipientEmail: c.recipientEmail,
      senderSignedAt: c.senderSignedAt,
      recipientSignedAt: c.recipientSignedAt,
      senderHashShort: c.senderSignatureHash?.slice(0, 8) ?? null,
      recipientHashShort: c.recipientSignatureHash?.slice(0, 8) ?? null,
      createdAt: c.createdAt,
    },
    milestones,
    case: caseInfo,
  });
}

// PATCH /api/contracts/[id] — currently supports linking to a case + setting expiry.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as {
    caseId?: string | null;
    expiryDate?: string | null;
  } | null;
  if (!body) return NextResponse.json({ error: "invalid json" }, { status: 400 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }
  const owner = await prisma.contract.findUnique({ where: { id }, select: { uid: true } });
  if (!owner) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (owner.uid !== uid) return NextResponse.json({ error: "not your contract" }, { status: 403 });
  if (body.caseId) {
    const target = await prisma.case.findUnique({ where: { id: body.caseId }, select: { uid: true } });
    if (target?.uid !== uid) return NextResponse.json({ error: "not your case" }, { status: 403 });
  }
  const data: Record<string, unknown> = {};
  if (body.caseId !== undefined) data.caseId = body.caseId;
  if (body.expiryDate !== undefined) {
    data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
  }
  const updated = await prisma.contract.update({ where: { id }, data });
  return NextResponse.json({ contract: { id: updated.id, caseId: updated.caseId, expiryDate: updated.expiryDate } });
}
