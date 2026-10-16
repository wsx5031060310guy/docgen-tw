import { NextResponse } from "next/server";
import { updateMilestoneStatus, type MilestoneStatus } from "@/lib/case-store";
import { readUidFromRequest } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

const STATUSES: MilestoneStatus[] = ["PENDING", "DONE", "OVERDUE", "CANCELLED"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { status?: MilestoneStatus } | null;
  if (!body?.status || !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const owner = await prisma.milestone.findUnique({
    where: { id },
    select: { contract: { select: { uid: true } } },
  });
  if (!owner) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (owner.contract.uid !== uid) return NextResponse.json({ error: "not your milestone" }, { status: 403 });
  const m = await updateMilestoneStatus(id, body.status);
  return NextResponse.json({ milestone: m });
}
