import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readUidFromRequest } from "@/lib/billing";
import { buildContractDocument, type Values } from "@/lib/templates";

export const runtime = "nodejs";

// PATCH /api/contracts/[id]/values  Body: { values, note? }
// Only the sender (matching uid cookie) can edit. Editing snapshots the
// previous version into ContractVersion, then overwrites Contract.values
// + rebuilds Contract.content. Refused once FULLY_SIGNED — at that point
// a new contract should be issued instead.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "no identity" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { values?: Values; note?: string } | null;
  if (!body?.values || typeof body.values !== "object") {
    return NextResponse.json({ error: "values required" }, { status: 400 });
  }

  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.uid && existing.uid !== uid) {
    return NextResponse.json({ error: "not your contract" }, { status: 403 });
  }
  if (existing.signingStatus === "FULLY_SIGNED") {
    return NextResponse.json(
      { error: "合約已雙方簽署，不可再修改。請建立新合約。" },
      { status: 409 },
    );
  }
  if (!existing.templateId) {
    return NextResponse.json({ error: "contract has no templateId" }, { status: 400 });
  }

  // Snapshot the current values as ContractVersion BEFORE overwriting.
  const existingVersions = await prisma.contractVersion.count({ where: { contractId: id } });
  const nextVersion = existingVersions + 1;

  // Rebuild content from new values
  let rebuilt;
  try {
    rebuilt = buildContractDocument(existing.templateId, body.values);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
  const content = [
    rebuilt.title,
    ...rebuilt.clauses.map((c) => `第 ${c.n} 條  ${c.title}\n${c.body}`),
    rebuilt.footer,
  ].join("\n\n");

  const [, updated] = await prisma.$transaction([
    prisma.contractVersion.create({
      data: {
        contractId: id,
        version: nextVersion,
        values: (existing.values ?? {}) as object,
        note: body.note ?? null,
        authorUid: uid,
      },
    }),
    prisma.contract.update({
      where: { id },
      data: {
        values: body.values as object,
        content,
        // Reset recipient signature since contract changed
        recipientSignatureUrl: null,
        recipientSignatureHash: null,
        recipientSignedAt: null,
        signingStatus: "AWAITING_RECIPIENT",
      },
    }),
  ]);

  return NextResponse.json({
    contract: { id: updated.id, signingStatus: updated.signingStatus },
    snapshotVersion: nextVersion,
  });
}
