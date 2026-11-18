import { NextResponse } from "next/server";
import { readUidFromRequest } from "@/lib/billing";
import { isLineLinked, issueLinkCode, unlinkLine } from "@/lib/contract-bot";

function currentUid(req: Request) {
  return readUidFromRequest(req);
}

export async function GET(req: Request) {
  const uid = currentUid(req);
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "資料庫尚未設定" }, { status: 503 });
  // No identity yet (first visit) simply means "not linked".
  return NextResponse.json({
    configured: Boolean(process.env.LINE_CHANNEL_SECRET && process.env.LINE_CHANNEL_ACCESS_TOKEN),
    linked: uid ? await isLineLinked(uid) : false,
    addFriendUrl: process.env.LINE_ADD_FRIEND_URL ?? null,
  });
}

export async function POST(req: Request) {
  const uid = currentUid(req);
  if (!uid) return NextResponse.json({ error: "請重新整理頁面後再試" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "資料庫尚未設定" }, { status: 503 });
  if (!process.env.LINE_CHANNEL_SECRET || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    return NextResponse.json({ error: "LINE 合約機器人尚未開通" }, { status: 503 });
  }
  return NextResponse.json(await issueLinkCode(uid));
}

export async function DELETE(req: Request) {
  const uid = currentUid(req);
  if (!uid) return NextResponse.json({ error: "請重新整理頁面後再試" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "資料庫尚未設定" }, { status: 503 });
  await unlinkLine(uid);
  return NextResponse.json({ ok: true });
}
