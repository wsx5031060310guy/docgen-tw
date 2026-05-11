import { NextResponse } from "next/server";
import { readUidFromRequest } from "@/lib/billing";
import { issueApiKey, listKeysForUid, revokeKey } from "@/lib/api-keys";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ keys: [] });
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }
  const keys = await listKeysForUid(uid);
  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "no identity cookie" }, { status: 400 });
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as { label?: string };
  const issued = await issueApiKey(uid, body.label);
  // Show raw key once; the client must save it.
  return NextResponse.json({ key: issued });
}

export async function DELETE(req: Request) {
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "no identity cookie" }, { status: 400 });
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const r = await revokeKey(uid, id);
  return NextResponse.json({ revoked: r.count });
}
