import { NextRequest, NextResponse } from "next/server";
import { decodeTradeInfo, getNewebpayConfig } from "@/lib/payment/newebpay";
import { prisma } from "@/lib/prisma";

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
  } catch (e) {
    console.error("[newebpay/notify]", e);
  }
  return new NextResponse("0");
}
