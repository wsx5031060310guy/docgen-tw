import { NextRequest, NextResponse } from "next/server";
import { getEcpayConfig, verifyCallback } from "@/lib/payment/ecpay";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });

  const { hashKey, hashIV } = getEcpayConfig();
  const verified = verifyCallback(params, hashKey, hashIV);

  const merchantTradeNo = params.MerchantTradeNo;
  const rtnCode = params.RtnCode;
  const paymentDate = params.PaymentDate ? new Date(params.PaymentDate.replace(/-/g, "/")) : null;

  if (merchantTradeNo) {
    const status = verified && rtnCode === "1" ? "PAID" : "FAILED";
    await prisma.order
      .update({
        where: { merchantTradeNo },
        data: {
          status,
          paymentMethod: params.PaymentType ?? null,
          paymentDate: paymentDate ?? null,
          rawCallback: JSON.stringify(params),
        },
      })
      .catch(() => null);
  }

  if (!verified) {
    return new NextResponse("0|CheckMacValue Error", { status: 400 });
  }

  return new NextResponse("1|OK", {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}
