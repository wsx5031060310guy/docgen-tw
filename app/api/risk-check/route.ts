import { NextResponse } from "next/server";
import { buildContractDocument, type Values } from "@/lib/templates";
import { runRiskCheck, summarizeRisk } from "@/lib/risk-rules";

// POST /api/risk-check
// Body: { templateId: string, values: Record<string,string> }
// Returns: { summary, findings }
export async function POST(req: Request) {
  let body: { templateId?: string; values?: Values };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { templateId, values } = body;
  if (!templateId || !values) {
    return NextResponse.json({ error: "templateId / values required" }, { status: 400 });
  }

  let doc;
  try {
    doc = buildContractDocument(templateId, values);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
  const fullText = doc.clauses.map((c) => c.body).join("\n");
  const findings = runRiskCheck({ templateId, values, fullText });
  const summary = summarizeRisk(findings);

  return NextResponse.json({ summary, findings });
}
