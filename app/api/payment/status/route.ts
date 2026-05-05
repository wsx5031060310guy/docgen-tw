import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const merchantTradeNo = req.nextUrl.searchParams.get("order");
  if (!merchantTradeNo) {
    return NextResponse.json({ error: "missing order" }, { status: 400 });
  }
  const order = await prisma.order.findUnique({ where: { merchantTradeNo } });
  if (!order) {
    return NextResponse.json({ status: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({
    merchantTradeNo: order.merchantTradeNo,
    status: order.status,
    amount: order.amount,
    itemName: order.itemName,
    paymentMethod: order.paymentMethod,
    paymentDate: order.paymentDate,
  });
}
