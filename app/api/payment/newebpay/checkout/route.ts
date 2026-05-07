import { NextRequest, NextResponse } from "next/server";
import { buildCheckoutPayload } from "@/lib/payment/newebpay";
import { getPlan } from "@/lib/payment/pricing";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteUrl(req: NextRequest) {
  return process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const planCode = String(body.plan ?? "single");
  const contractId = body.contractId ? String(body.contractId) : null;
  const email = String(body.email ?? "buyer@docgen.tw");

  const plan = getPlan(planCode);
  if (!plan) {
    return NextResponse.json({ error: "invalid plan" }, { status: 400 });
  }

  const merchantOrderNo = `DOC${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`.slice(0, 20);

  await prisma.order.create({
    data: {
      merchantTradeNo: merchantOrderNo,
      contractId,
      provider: "newebpay",
      amount: plan.amount,
      itemName: plan.name,
      status: "PENDING",
    },
  });

  const base = siteUrl(req);
  const { endpoint, params } = buildCheckoutPayload({
    merchantOrderNo,
    amount: plan.amount,
    itemDesc: plan.name,
    email,
    returnUrl: `${base}/api/payment/newebpay/return`,
    notifyUrl: `${base}/api/payment/newebpay/notify`,
    clientBackUrl: `${base}/payment/success?order=${merchantOrderNo}`,
  });

  return NextResponse.json({ endpoint, params, merchantOrderNo });
}
