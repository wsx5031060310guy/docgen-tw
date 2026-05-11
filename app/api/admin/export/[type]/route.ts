import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorised, unauthorisedResponse } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv";

export const runtime = "nodejs";

type ExportType = "contracts" | "orders" | "referrals" | "usage" | "deliveries";
const ALLOWED: ExportType[] = ["contracts", "orders", "referrals", "usage", "deliveries"];

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  if (!isAdminAuthorised(req)) return unauthorisedResponse();
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }
  const { type } = await params;
  if (!ALLOWED.includes(type as ExportType)) {
    return NextResponse.json({ error: "unknown export type" }, { status: 400 });
  }

  let csv: string;
  switch (type as ExportType) {
    case "contracts": {
      const rows = await prisma.contract.findMany({
        orderBy: { createdAt: "desc" },
        take: 10_000,
        select: {
          id: true, templateId: true, client: true, recipientName: true, recipientEmail: true,
          signingStatus: true, uid: true, caseId: true, createdAt: true, updatedAt: true,
        },
      });
      csv = toCsv(rows);
      break;
    }
    case "orders": {
      const rows = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10_000,
        select: {
          id: true, merchantTradeNo: true, contractId: true, provider: true,
          amount: true, itemName: true, planCode: true, uid: true, buyerEmail: true,
          status: true, paymentMethod: true, paymentDate: true, createdAt: true,
        },
      });
      csv = toCsv(rows);
      break;
    }
    case "referrals": {
      const rows = await prisma.lawyerReferral.findMany({
        orderBy: { createdAt: "desc" },
        take: 10_000,
      });
      csv = toCsv(rows);
      break;
    }
    case "usage": {
      const rows = await prisma.usage.findMany({
        orderBy: [{ month: "desc" }, { count: "desc" }],
        take: 10_000,
      });
      csv = toCsv(rows);
      break;
    }
    case "deliveries": {
      const rows = await prisma.webhookDelivery.findMany({
        orderBy: { createdAt: "desc" },
        take: 10_000,
        select: {
          id: true, uid: true, event: true, url: true, status: true, ok: true,
          attempt: true, succeeded: true, durationMs: true, reason: true,
          createdAt: true,
        },
      });
      csv = toCsv(rows);
      break;
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="docgen-${type}-${date}.csv"`,
    },
  });
}
