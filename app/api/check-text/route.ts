import { NextResponse } from "next/server";
import { runTextOnlyRiskCheck, summarizeRisk } from "@/lib/risk-rules-text";

// POST /api/check-text  Body: { text: string }
// Public endpoint — no auth, no DB writes. Lightweight rate-protection via
// max payload size only.
export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const text = String(body?.text ?? "");
  if (!text.trim()) return NextResponse.json({ error: "text required" }, { status: 400 });
  if (text.length > 50_000) {
    return NextResponse.json({ error: "text too long (max 50,000 chars)" }, { status: 413 });
  }
  const findings = runTextOnlyRiskCheck(text);
  const summary = summarizeRisk(findings);
  return NextResponse.json({ summary, findings, chars: text.length });
}
