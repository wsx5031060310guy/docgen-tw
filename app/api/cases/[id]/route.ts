import { NextResponse } from "next/server";
import { getCase, attachContractToCase } from "@/lib/case-store";
import { readUidFromRequest } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  try {
    const c = await getCase(id);
    if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (c.uid !== uid) return NextResponse.json({ error: "not your case" }, { status: 403 });
    return NextResponse.json({ case: c });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PATCH: attach a contract to this case (caller must own both)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { contractId?: string } | null;
  if (!body?.contractId) {
    return NextResponse.json({ error: "contractId required" }, { status: 400 });
  }
  try {
    const [kase, contract] = await Promise.all([
      prisma.case.findUnique({ where: { id }, select: { uid: true } }),
      prisma.contract.findUnique({ where: { id: body.contractId }, select: { uid: true } }),
    ]);
    if (!kase || !contract) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (kase.uid !== uid || contract.uid !== uid) {
      return NextResponse.json({ error: "not yours" }, { status: 403 });
    }
    const c = await attachContractToCase(body.contractId, id);
    return NextResponse.json({ contract: c });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
