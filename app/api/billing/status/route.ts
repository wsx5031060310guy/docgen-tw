import { NextResponse } from "next/server";
import {
  getBillingStatus,
  newUid,
  readUidFromRequest,
  writeUidCookie,
} from "@/lib/billing";

export const runtime = "nodejs";

// GET /api/billing/status — returns current uid's plan + monthly usage.
// Sets a uid cookie if absent so subsequent calls (contract create, checkout)
// can reference the same anonymous identity.
export async function GET(req: Request) {
  let uid = readUidFromRequest(req);
  const setCookie = !uid;
  if (!uid) uid = newUid();

  const status = await getBillingStatus(uid);
  const res = NextResponse.json(status);
  if (setCookie) {
    writeUidCookie(res, uid);
  }
  return res;
}
