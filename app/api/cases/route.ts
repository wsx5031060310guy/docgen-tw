import { NextResponse } from "next/server";
import { createCase, listCases } from "@/lib/case-store";
import { newUid, readUidFromRequest, writeUidCookie } from "@/lib/billing";

export async function GET(req: Request) {
  const uid = readUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  try {
    const cases = await listCases({ uid });
    return NextResponse.json({ cases });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { title, clientName, counterparty, notes, ownerEmail } = body ?? {};
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  let uid = readUidFromRequest(req);
  const setCookie = !uid;
  if (!uid) uid = newUid();
  try {
    const c = await createCase({ title, clientName, counterparty, notes, ownerEmail, uid });
    const res = NextResponse.json({ case: c });
    if (setCookie) writeUidCookie(res, uid);
    return res;
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
