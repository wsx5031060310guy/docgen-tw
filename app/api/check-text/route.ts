import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { runTextOnlyRiskCheck, summarizeRisk } from "@/lib/risk-rules-text";
import { runLlmRiskCheck } from "@/lib/llm-risk";
import { suggestTemplate } from "@/lib/template-suggest";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

// POST /api/check-text
// Body: { text: string, llm?: boolean, share?: boolean }
// Returns: { summary, findings, llm: { findings, reason? }, chars, shareId? }
export async function POST(req: Request) {
  // IP-based rate limit (public endpoint). Lenient for non-LLM (cheap),
  // tighter for LLM mode (cost guard against scraping our free Gemini tier).
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const wantLlm = Boolean(body?.llm);
  const wantShare = Boolean(body?.share);
  const rlLimit = wantLlm ? 5 : 30; // per minute per IP
  const rl = checkRateLimit(`check:${ip}:${wantLlm ? "llm" : "rules"}`, rlLimit);
  if (!rl.ok) {
    const retrySec = Math.ceil(rl.resetMs / 1000);
    return new NextResponse(
      JSON.stringify({ error: `rate limited (${rlLimit}/min per IP)`, retryAfter: retrySec }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(retrySec),
        },
      },
    );
  }
  const text = String(body?.text ?? "");
  const llm = wantLlm;
  const share = wantShare;
  if (!text.trim()) return NextResponse.json({ error: "text required" }, { status: 400 });
  if (text.length > 50_000) {
    return NextResponse.json({ error: "text too long (max 50,000 chars)" }, { status: 413 });
  }

  const ruleFindings = runTextOnlyRiskCheck(text);
  let llmResult: { findings: unknown[]; reason?: string } = { findings: [] };
  if (llm) {
    llmResult = await runLlmRiskCheck(text, ruleFindings.map((f) => f.title));
  }

  // Combine for summary purposes — LLM red findings count too
  const combined = [
    ...ruleFindings,
    ...(llmResult.findings as { level: "red" | "yellow" | "green-info"; referLawyer: boolean }[])
      // shape-cast: we only need level + referLawyer for summarizeRisk()
      .map((f) => ({ ...f } as unknown as (typeof ruleFindings)[number])),
  ];
  const summary = summarizeRisk(combined);

  let shareId: string | undefined;
  if (share && process.env.DATABASE_URL) {
    try {
      const id = crypto.randomBytes(9).toString("base64url");
      const expiresAt = new Date(Date.now() + 30 * 86400_000); // 30 days
      await prisma.sharedCheck.create({
        data: {
          id,
          text: text.slice(0, 50_000),
          summary: summary as unknown as object,
          findings: combined as unknown as object,
          llmReason: llmResult.reason ?? null,
          expiresAt,
        },
      });
      shareId = id;
    } catch (err) {
      // Non-fatal — share creation failure shouldn't break the response.
      console.error("share create failed", err);
    }
  }

  const suggestion = suggestTemplate(text);
  const templateSuggestion = suggestion
    ? {
        templateId: suggestion.templateId,
        name: suggestion.template.name,
        score: suggestion.score,
        reasonMatches: suggestion.reasonMatches.slice(0, 4),
      }
    : null;

  return NextResponse.json({
    summary,
    findings: ruleFindings,
    llm: llmResult,
    chars: text.length,
    shareId,
    templateSuggestion,
  });
}
