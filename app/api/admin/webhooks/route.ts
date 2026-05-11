import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorised, unauthorisedResponse } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthorised(req)) return unauthorisedResponse();
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }
  const [deliveries, fails24h] = await Promise.all([
    prisma.webhookDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.webhookDelivery.count({
      where: { ok: false, createdAt: { gte: new Date(Date.now() - 86400_000) } },
    }),
  ]);
  return NextResponse.json({ deliveries, fails24h });
}
