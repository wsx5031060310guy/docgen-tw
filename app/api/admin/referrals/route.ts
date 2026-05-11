import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorised, unauthorisedResponse } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthorised(req)) return unauthorisedResponse();
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }
  const rows = await prisma.lawyerReferral.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ referrals: rows });
}

export async function PATCH(req: Request) {
  if (!isAdminAuthorised(req)) return unauthorisedResponse();
  const body = (await req.json().catch(() => null)) as { id?: string; status?: string; internalNotes?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.internalNotes !== undefined) data.internalNotes = body.internalNotes;
  const r = await prisma.lawyerReferral.update({ where: { id: body.id }, data });
  return NextResponse.json({ referral: r });
}
