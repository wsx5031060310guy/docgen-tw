import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/router-client";

// POST /api/clause-suggest
// Body: { context: string, hint?: string }
// Returns: { clauses: string[] }
//
// Free-tier-friendly endpoint that asks the Smart Router for 3 short
// extra clauses tailored to the supplied context. Intended as an
// optional "AI suggestions" panel on the contract editor — UI can
// drop the response if the router is offline.
export async function POST(req: NextRequest) {
  const { context, hint } = (await req.json()) as { context?: string; hint?: string };
  if (!context) return NextResponse.json({ error: "context required" }, { status: 400 });

  const system = "你是台灣法律合約助手。輸出格式：每行一條短條款，不要編號、不要解釋。最多 3 條。";
  const user = `合約背景：${context}\n${hint ? `要點提示：${hint}\n` : ""}請建議 3 條補充條款（繁體中文）。`;

  try {
    const text = await chat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { tier: "free" }
    );
    const clauses = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 3);
    return NextResponse.json({ clauses });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
