import { NextResponse } from "next/server";
import {
  getBillingStatus,
  newUid,
  readUidFromRequest,
  UID_COOKIE,
  UID_COOKIE_MAX_AGE,
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
    res.cookies.set(UID_COOKIE, uid, {
      httpOnly: false, sameSite: "lax", maxAge: UID_COOKIE_MAX_AGE, path: "/",
    });
  }
  return res;
}
