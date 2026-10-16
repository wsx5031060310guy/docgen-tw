import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readUidFromRequest } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ versions: [], current: null });

  const contract = await prisma.contract.findUnique({
    where: { id },
    select: { id: true, uid: true, values: true, signingStatus: true, updatedAt: true },
  });
  if (!contract) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (contract.uid !== uid) {
    return NextResponse.json({ error: "not your contract" }, { status: 403 });
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
