import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/payment/stripe";
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
  const customerEmail = typeof body.email === "string" ? body.email : null;

  const plan = getPlan(planCode);
  if (!plan) {
    return NextResponse.json({ error: "invalid plan" }, { status: 400 });
  }

  const merchantTradeNo = `DOC${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`.slice(0, 20);

  await prisma.order
    .create({
      data: {
        merchantTradeNo,
        contractId,
        provider: "stripe",
        amount: plan.amount,
        itemName: plan.name,
        status: "PENDING",
      },
    })
    .catch(() => null);

  const base = siteUrl(req);
  try {
    const session = await createCheckoutSession({
      amountTwd: plan.amount,
      itemName: plan.name,
      merchantTradeNo,
      contractId,
      customerEmail,
      successUrl: `${base}/payment/success?order=${merchantTradeNo}&session={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/payment/cancelled?order=${merchantTradeNo}`,
    });
    return NextResponse.json({ url: session.url, id: session.id, merchantTradeNo });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "stripe error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
