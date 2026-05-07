import { NextResponse } from "next/server";
import { getNewebpayConfig } from "@/lib/payment/newebpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Diagnostic endpoint. Returns lengths + first/last char of each NewebPay env
// so you can spot trailing whitespace / wrong-field paste mistakes WITHOUT
// leaking the actual secrets. Remove once payment is verified working.
export async function GET() {
  const cfg = getNewebpayConfig();
  const fingerprint = (s: string) => ({
    length: s.length,
    first: s.slice(0, 2),
    last: s.slice(-2),
    hasWhitespace: /\s/.test(s),
  });
  return NextResponse.json({
    merchantId: fingerprint(cfg.merchantId),
    hashKey: fingerprint(cfg.hashKey),
    hashIv: fingerprint(cfg.hashIv),
    apiBase: cfg.apiBase, // not secret
    expectedHashKeyLen: 32,
    expectedHashIvLen: 16,
  });
}
