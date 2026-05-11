import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorised, unauthorisedResponse } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthorised(req)) return unauthorisedResponse();
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const status = url.searchParams.get("status") || undefined;
  const where: Record<string, unknown> = {};
  if (status) where.signingStatus = status;
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { client: { contains: q, mode: "insensitive" } },
      { recipientName: { contains: q, mode: "insensitive" } },
      { recipientEmail: { contains: q, mode: "insensitive" } },
      { uid: { contains: q } },
    ];
  }
  const rows = await prisma.contract.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, templateId: true, client: true, recipientName: true,
      recipientEmail: true, signingStatus: true, uid: true, caseId: true,
      createdAt: true,
      milestones: { select: { id: true, status: true } },
      orders: { select: { merchantTradeNo: true, planCode: true, amount: true, status: true } },
    },
  });
  return NextResponse.json({ contracts: rows });
}

// PATCH /api/admin/contracts?id=…  Body: { uid?: string | null, caseId?: string | null }
// Allows admin to re-attribute a contract to a different uid (e.g. when the
// original cookie was lost) or move it to a different case.
export async function PATCH(req: Request) {
  if (!isAdminAuthorised(req)) return unauthorisedResponse();
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const body = (await req.json().catch(() => null)) as { uid?: string | null; caseId?: string | null } | null;
  if (!body) return NextResponse.json({ error: "invalid json" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (body.uid !== undefined) data.uid = body.uid || null;
  if (body.caseId !== undefined) data.caseId = body.caseId || null;
  const updated = await prisma.contract.update({
    where: { id },
    data,
    select: { id: true, uid: true, caseId: true },
  });
  return NextResponse.json({ contract: updated });
}

export async function DELETE(req: Request) {
  if (!isAdminAuthorised(req)) return unauthorisedResponse();
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const force = url.searchParams.get("force") === "1";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Safety: refuse to delete if any non-PENDING order references this contract
  // unless ?force=1 is passed.
  if (!force) {
    const paid = await prisma.order.findFirst({
      where: { contractId: id, status: "PAID" },
      select: { id: true },
    });
    if (paid) {
      return NextResponse.json(
        { error: "contract has a PAID order. Pass ?force=1 to override.", paidOrderId: paid.id },
        { status: 409 },
      );
    }
  }

  // Cascade: Milestone has onDelete: Cascade; Order has nullable contractId
  // (no cascade), so first detach orders.
  await prisma.order.updateMany({ where: { contractId: id }, data: { contractId: null } });
  await prisma.contract.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
