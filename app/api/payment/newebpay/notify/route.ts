import { NextRequest, NextResponse } from "next/server";
import { decodeTradeInfo, getNewebpayConfig } from "@/lib/payment/newebpay";
import { prisma } from "@/lib/prisma";
import { activatePro } from "@/lib/billing";

const PRO_PLAN_DAYS: Record<string, number> = {
  pro: 30,   // monthly subscription (single-payment, 30 days of Pro)
  pack: 90,  // pack = 10 contracts; we map to 90 days of Pro for simplicity
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// NewebPay server-to-server notify. ALWAYS echo "0" — anything else triggers
// retry storm. Idempotent: skip if order is already terminal.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const tradeInfoHex = String(form.get("TradeInfo") ?? "");
    const status = String(form.get("Status") ?? "");
    const { hashKey, hashIv } = getNewebpayConfig();

    const decoded = decodeTradeInfo(tradeInfoHex, hashKey, hashIv);

    let result: Record<string, unknown> = {};
    try {
      result = JSON.parse(decoded.JSONResult ?? decoded.Result ?? "{}");
    } catch {
      result = {};
    }
    const merchantOrderNo: string =
      (result.MerchantOrderNo as string) ?? decoded.MerchantOrderNo ?? "";
    const tradeNo: string | undefined = result.TradeNo as string | undefined;
    const paymentType: string | undefined = result.PaymentType as string | undefined;

    if (!merchantOrderNo) return new NextResponse("0");

    const order = await prisma.order.findUnique({
      where: { merchantTradeNo: merchantOrderNo },
    });
    if (!order) return new NextResponse("0");

    if (order.status === "PAID" || order.status === "FAILED") {
      return new NextResponse("0");
    }

    await prisma.order.update({
      where: { merchantTradeNo: merchantOrderNo },
      data: {
        status: status === "SUCCESS" ? "PAID" : "FAILED",
        paymentMethod: paymentType ?? null,
        paymentDate: new Date(),
        rawCallback: JSON.stringify({ status, decoded, tradeNo }),
      },
    });

    // Activate Pro plan on successful payment when planCode warrants it.
    if (status === "SUCCESS" && order.uid && order.planCode) {
      const days = PRO_PLAN_DAYS[order.planCode];
      if (days) {
        try {
          await activatePro({
            uid: order.uid,
            email: order.buyerEmail,
            orderId: order.id,
            days,
          });
        } catch (err) {
          console.error("[newebpay/notify] activatePro failed", err);
        }
      }
    }
  } catch (e) {
    console.error("[newebpay/notify]", e);
  }
  return new NextResponse("0");
}
