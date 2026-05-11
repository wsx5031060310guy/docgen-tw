import { NextRequest, NextResponse } from "next/server";
import { buildCheckoutPayload } from "@/lib/payment/newebpay";
import { getPlan } from "@/lib/payment/pricing";
import { prisma } from "@/lib/prisma";
import { newUid, readUidFromRequest, UID_COOKIE, UID_COOKIE_MAX_AGE } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteUrl(req: NextRequest) {
  return process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const planCode = String(body.plan ?? "single");
  const contractId = body.contractId ? String(body.contractId) : null;
  const email = String(body.email ?? "buyer@docgen.tw").trim();

  const plan = getPlan(planCode);
  if (!plan) {
    return NextResponse.json({ error: "invalid plan" }, { status: 400 });
  }

  // Identity tag — so the notify handler can activate the right PRO seat.
  let uid = readUidFromRequest(req as unknown as Request);
  const setUidCookie = !uid;
  if (!uid) uid = newUid();

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
      planCode,
      uid,
      buyerEmail: email,
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

  const res = NextResponse.json({ endpoint, params, merchantOrderNo });
  if (setUidCookie) {
    res.cookies.set(UID_COOKIE, uid, {
      httpOnly: false, sameSite: "lax", maxAge: UID_COOKIE_MAX_AGE, path: "/",
    });
  }
  return res;
}
