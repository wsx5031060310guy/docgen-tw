import { NextResponse } from "next/server";
import { updateMilestoneStatus, type MilestoneStatus } from "@/lib/case-store";

const STATUSES: MilestoneStatus[] = ["PENDING", "DONE", "OVERDUE", "CANCELLED"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { status?: MilestoneStatus } | null;
  if (!body?.status || !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const m = await updateMilestoneStatus(id, body.status);
  return NextResponse.json({ milestone: m });
}
