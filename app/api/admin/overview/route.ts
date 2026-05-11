import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorised, unauthorisedResponse } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthorised(req)) return unauthorisedResponse();
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }

  const [casesCount, contractsCount, milestonesCount, overdueMilestones, recentContracts, recentCases] = await Promise.all([
    prisma.case.count(),
    prisma.contract.count(),
    prisma.milestone.count(),
    prisma.milestone.findMany({
      where: { status: "OVERDUE" },
      orderBy: { dueDate: "asc" },
      take: 50,
      include: {
        contract: {
          select: {
            id: true,
            templateId: true,
            recipientName: true,
            recipientEmail: true,
            case: { select: { id: true, title: true } },
          },
        },
      },
    }),
    prisma.contract.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        templateId: true,
        signingStatus: true,
        recipientName: true,
        createdAt: true,
        case: { select: { id: true, title: true } },
      },
    }),
    prisma.case.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { contracts: { select: { id: true } }, attachments: { select: { id: true } } },
    }),
  ]);

  // Outstanding amount (sum of overdue PAYMENT amounts)
  const outstandingNtd = overdueMilestones
    .filter((m) => m.kind === "PAYMENT" && m.amount != null)
    .reduce((s, m) => s + (m.amount ?? 0), 0);

  return NextResponse.json({
    stats: {
      cases: casesCount,
      contracts: contractsCount,
      milestones: milestonesCount,
      overdueCount: overdueMilestones.length,
      outstandingNtd,
    },
    overdueMilestones,
    recentContracts,
    recentCases,
  });
}
