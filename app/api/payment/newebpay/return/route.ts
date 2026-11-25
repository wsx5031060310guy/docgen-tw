import { NextRequest, NextResponse } from "next/server";
import { getNewebpayConfig, readPaymentCallback } from "@/lib/payment/newebpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Browser-side return URL. Just redirects to /payment/success?order=...
// The actual order state mutation happens in /api/payment/newebpay/notify.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  let merchantOrderNo: string | null = null;
  // best-effort: don't crash if decryption fails — notify route is the
  // authoritative state writer.
  try {
    const { hashKey, hashIv } = getNewebpayConfig();
    ({ merchantOrderNo } = readPaymentCallback(
      String(form?.get("TradeInfo") ?? ""),
      String(form?.get("TradeSha") ?? ""),
      hashKey,
      hashIv,
    ));
  } catch {}
  const base = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const url = merchantOrderNo
    ? `${base}/payment/success?order=${merchantOrderNo}`
    : `${base}/payment/success`;
  return NextResponse.redirect(url, { status: 303 });
}
