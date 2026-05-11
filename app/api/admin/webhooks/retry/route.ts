import { NextResponse } from "next/server";
import { retryPendingWebhooks } from "@/lib/webhooks";
import { isAdminAuthorised, unauthorisedResponse } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

// Force-retry all pending webhook deliveries now (admin-only).
// Useful between cron runs when you've fixed a downstream endpoint.
export async function POST(req: Request) {
  if (!isAdminAuthorised(req)) return unauthorisedResponse();
  const r = await retryPendingWebhooks();
  return NextResponse.json({ ok: true, ...r });
}
