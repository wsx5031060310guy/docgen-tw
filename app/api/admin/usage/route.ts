import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorised, unauthorisedResponse } from "@/lib/admin-auth";
import { thisMonth } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthorised(req)) return unauthorisedResponse();
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }

  const month = thisMonth();
  const now = new Date();
  const startOfMonth = new Date(now);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [billingRows, topUsage, paidOrdersThisMonth, paidLast30, totalContracts] = await Promise.all([
    prisma.billingProfile.findMany({ orderBy: { updatedAt: "desc" }, take: 50 }),
    prisma.usage.findMany({
      where: { month },
      orderBy: { count: "desc" },
      take: 20,
    }),
    prisma.order.findMany({
      where: { status: "PAID", paymentDate: { gte: startOfMonth } },
      orderBy: { paymentDate: "desc" },
      take: 50,
      select: {
        id: true, merchantTradeNo: true, planCode: true, buyerEmail: true,
        amount: true, paymentDate: true, uid: true,
      },
    }),
    prisma.order.aggregate({
      where: { status: "PAID", paymentDate: { gte: new Date(now.getTime() - 30 * 86400_000) } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.contract.count(),
  ]);

  const proActive = billingRows.filter((b) => b.plan === "PRO" && b.periodEnd && b.periodEnd > now).length;
  const proExpired = billingRows.filter((b) => b.plan === "PRO" && (!b.periodEnd || b.periodEnd <= now)).length;
  const totalUids = billingRows.length;
  const conversion = totalUids > 0 ? proActive / totalUids : 0;

  return NextResponse.json({
    month,
    stats: {
      proActive,
      proExpired,
      totalUidsWithProfile: totalUids,
      totalContracts,
      paidOrdersLast30: paidLast30._count,
      revenueLast30Ntd: paidLast30._sum.amount ?? 0,
      conversionPct: Math.round(conversion * 1000) / 10,
    },
    topUsageThisMonth: topUsage,
    paidOrdersThisMonth,
  });
}
