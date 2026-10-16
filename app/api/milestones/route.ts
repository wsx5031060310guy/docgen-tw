import { NextResponse } from "next/server";
import { createMilestone, type MilestoneKind } from "@/lib/case-store";
import { readUidFromRequest } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

const KINDS: MilestoneKind[] = ["PAYMENT", "DELIVERY", "RENEWAL", "CUSTOM"];

export async function POST(req: Request) {
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { contractId, kind, title, amount, dueDate, note } = body ?? {};
  if (!contractId || !title || !dueDate) {
    return NextResponse.json({ error: "contractId / title / dueDate required" }, { status: 400 });
  }
  if (!KINDS.includes(kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return NextResponse.json({ error: "dueDate not parseable" }, { status: 400 });
  }
  const contract = await prisma.contract.findUnique({ where: { id: contractId }, select: { uid: true } });
  if (!contract) return NextResponse.json({ error: "contract not found" }, { status: 404 });
  if (contract.uid !== uid) return NextResponse.json({ error: "not your contract" }, { status: 403 });
  const m = await createMilestone({
    contractId,
    kind,
    title,
    amount: typeof amount === "number" ? amount : undefined,
    dueDate: due,
    note,
  });
  return NextResponse.json({ milestone: m });
}
