import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Browser-side return URL. Just redirects to /payment/success?order=...
// The actual order state mutation happens in /api/payment/newebpay/notify.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const tradeInfo = form?.get("TradeInfo");
  let merchantOrderNo: string | null = null;
  if (tradeInfo) {
    // best-effort: don't crash if decryption fails — notify route is the
    // authoritative state writer.
    try {
      const { decodeTradeInfo, getNewebpayConfig } = await import("@/lib/payment/newebpay");
      const { hashKey, hashIv } = getNewebpayConfig();
      const decoded = decodeTradeInfo(String(tradeInfo), hashKey, hashIv);
      const r = JSON.parse(decoded.JSONResult ?? decoded.Result ?? "{}");
      merchantOrderNo = (r.MerchantOrderNo as string) ?? decoded.MerchantOrderNo ?? null;
    } catch {}
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const url = merchantOrderNo
    ? `${base}/payment/success?order=${merchantOrderNo}`
    : `${base}/payment/success`;
  return NextResponse.redirect(url, { status: 303 });
}
