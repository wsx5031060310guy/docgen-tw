import { NextResponse } from "next/server";
import { getCase, attachContractToCase } from "@/lib/case-store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const c = await getCase(id);
    if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ case: c });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PATCH: attach a contract to this case
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { contractId?: string } | null;
  if (!body?.contractId) {
    return NextResponse.json({ error: "contractId required" }, { status: 400 });
  }
  try {
    const c = await attachContractToCase(body.contractId, id);
    return NextResponse.json({ contract: c });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
