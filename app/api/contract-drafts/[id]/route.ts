import { NextResponse } from "next/server";
import { findDraft } from "@/lib/contract-bot";

const noStore = { "Cache-Control": "no-store" };

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("t") ?? "";
  const draft = await findDraft(id, token);
  if (!draft) return NextResponse.json({ error: "找不到草稿" }, { status: 404, headers: noStore });
  if (draft.usedAt) {
    return NextResponse.json({ error: "這份草稿已建立合約" }, { status: 410, headers: noStore });
  }
  return NextResponse.json(
    { templateId: draft.templateId, values: draft.values, transcript: draft.transcript },
    { headers: noStore },
  );
}
