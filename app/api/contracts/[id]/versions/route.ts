import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readUidFromRequest } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) return NextResponse.json({ versions: [], current: null });

  const uid = readUidFromRequest(req);
  const contract = await prisma.contract.findUnique({
    where: { id },
    select: { id: true, uid: true, values: true, signingStatus: true, updatedAt: true },
  });
  if (!contract) return NextResponse.json({ error: "not found" }, { status: 404 });
  // Owner-only (silent: return empty for non-owners to avoid leaking)
  if (contract.uid && contract.uid !== uid) {
    return NextResponse.json({ versions: [], current: null }, { status: 200 });
  }
  const versions = await prisma.contractVersion.findMany({
    where: { contractId: id },
    orderBy: { version: "desc" },
    select: { id: true, version: true, values: true, note: true, createdAt: true },
  });
  return NextResponse.json({
    versions,
    current: {
      values: contract.values,
      signingStatus: contract.signingStatus,
      updatedAt: contract.updatedAt,
    },
  });
}
