// Minimal admin auth: compares a shared key in request (cookie or query) against
// the ADMIN_KEY env var. Use until we add real auth.js.
//
// Server-side use: call ensureAdmin(req) in API routes / server components.

import { NextResponse } from "next/server";

export function isAdminAuthorised(req: Request): boolean {
  const expected = process.env.ADMIN_KEY?.trim();
  if (!expected) return false; // Never allow if not configured
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("key");
  if (fromQuery && fromQuery === expected) return true;
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)docgen_admin=([^;]+)/);
  if (m && decodeURIComponent(m[1]) === expected) return true;
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${expected}`) return true;
  return false;
}

export function unauthorisedResponse() {
  return NextResponse.json({ error: "unauthorised" }, { status: 401 });
}
