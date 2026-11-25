import { NextRequest, NextResponse } from "next/server";
import { getNewebpayConfig, readPaymentCallback, type PaymentCallback } from "@/lib/payment/newebpay";
import { prisma } from "@/lib/prisma";
import { activatePro } from "@/lib/billing";

const PRO_PLAN_DAYS: Record<string, number> = {
  pro: 30,   // monthly subscription (single-payment, 30 days of Pro)
  pack: 90,  // pack = 10 contracts; we map to 90 days of Pro for simplicity
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// NewebPay server-to-server notify. The gateway retries up to 3 times until it
// sees HTTP 200, so anything that should be retried must not answer 200.
export async function POST(req: NextRequest) {
  let callback: PaymentCallback;
  try {
    const form = await req.formData();
    const { hashKey, hashIv } = getNewebpayConfig();
    callback = readPaymentCallback(
      String(form.get("TradeInfo") ?? ""),
      String(form.get("TradeSha") ?? ""),
      hashKey,
      hashIv,
    );
  } catch (e) {
    console.error("[newebpay/notify] rejected", e);
    return new NextResponse("rejected", { status: 400 });
  }
  const { outcome, merchantOrderNo, amount, paymentType, payload } = callback;

  const order = await prisma.order.findUnique({
    where: { merchantTradeNo: merchantOrderNo },
  });
  if (!order) return new NextResponse("0");
  if (outcome === "PENDING") {
    console.warn("[newebpay/notify] SUCCESS without PayTime, not credited", { merchantOrderNo, paymentType });
    return new NextResponse("0");
  }
  if (outcome === "PAID" && amount !== order.amount) {
    console.error("[newebpay/notify] amount mismatch", { merchantOrderNo, amount, expected: order.amount });
    return new NextResponse("0");
  }

  // Claim the order and activate in one transaction: concurrent or repeated
  // notifies credit once, and a failed activation leaves the order retryable.
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      // A payment may succeed after a failed attempt, so FAILED can still become PAID.
      where: { id: order.id, status: { in: outcome === "PAID" ? ["PENDING", "FAILED"] : ["PENDING"] } },
      data: {
        status: outcome,
        paymentMethod: paymentType ?? null,
        paymentDate: new Date(),
        rawCallback: JSON.stringify(payload),
      },
    });
    // Activate Pro plan on successful payment when planCode warrants it.
    const days = PRO_PLAN_DAYS[order.planCode ?? ""];
    if (claimed.count === 1 && outcome === "PAID" && order.uid && days) {
      await activatePro({ uid: order.uid, email: order.buyerEmail, orderId: order.id, days }, tx);
    }
  });
  return new NextResponse("0");
}
