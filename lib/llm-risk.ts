// LLM-augmented risk check helper. Asks the LLM to identify clauses NOT
// already flagged by the rule-based pass, in a strict JSON schema so we can
// merge into the existing RiskFinding list.

import { openrouterChat, openrouterConfigured } from "./openrouter";
import type { RiskFinding } from "./risk-rules";

export interface LlmFinding extends Omit<RiskFinding, "id"> {
  source: "llm";
}

const SYSTEM = `你是熟悉中華民國民法、勞動基準法、消費者保護法、營業秘密法之合約審閱助手。
任務：審閱使用者貼上之合約文字，找出 1–5 條「規則式檢查可能漏掉」的高風險條款，
以嚴格 JSON 格式回傳。原則：
1. 只回 JSON，外面不要加 markdown / 解說。
2. 每條 finding 包含：title (≤25字)、detail (≤120字 解釋為什麼有風險)、suggestion (具體修改建議，≤80字)、level (red 或 yellow)、legalBasis (法條陣列，至多 2 條)、referLawyer (boolean)。
3. 不要重複「年利率超過 16%」「永久保密」「外國管轄」等規則式檢查已會處理之常見項目。
4. 找不到新風險時回 [] (空陣列)。
5. 全部用繁體中文。`;

interface RawLlmOutput {
  title?: string;
  detail?: string;
  suggestion?: string;
  level?: string;
  legalBasis?: string[];
  referLawyer?: boolean;
}

function coerce(raw: RawLlmOutput, i: number): LlmFinding | null {
  if (!raw?.title || !raw?.detail) return null;
  const level = raw.level === "red" ? "red" : "yellow";
  return {
    source: "llm",
    level,
    title: String(raw.title).slice(0, 60),
    detail: String(raw.detail).slice(0, 300),
    suggestion: String(raw.suggestion ?? "").slice(0, 200),
    legalBasis: Array.isArray(raw.legalBasis) ? raw.legalBasis.slice(0, 3).map(String) : [],
    referLawyer: Boolean(raw.referLawyer),
    // id is added by caller — use a stable-ish prefix
    ...{ id: `llm-${i}` },
  } as LlmFinding;
}

function stripCodeFence(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function runLlmRiskCheck(
  fullText: string,
  ruleBasedTitles: string[],
): Promise<{ findings: (LlmFinding & { id: string })[]; reason?: string }> {
  if (!openrouterConfigured()) {
    return { findings: [], reason: "OPENROUTER_API_KEY not configured" };
  }
  if (!fullText.trim()) return { findings: [] };
  if (fullText.length > 20_000) {
    // truncate to keep token cost down on free tier
    fullText = fullText.slice(0, 20_000);
  }

  const user =
    `規則式檢查已偵測到以下標題（請避開）：\n${ruleBasedTitles.map((t) => `- ${t}`).join("\n") || "(無)"}\n\n` +
    `=== 合約文字開始 ===\n${fullText}\n=== 合約文字結束 ===\n\n` +
    `請回傳 JSON 陣列，每元素含 {title, detail, suggestion, level, legalBasis, referLawyer}。`;

  let raw: string;
  try {
    raw = await openrouterChat(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      { maxTokens: 900, timeoutMs: 25_000 },
    );
  } catch (err) {
    return { findings: [], reason: (err as Error).message };
  }

  const cleaned = stripCodeFence(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // model may have returned text — search for the first [ ... ] block
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (!m) return { findings: [], reason: "could not parse LLM output as JSON" };
    try {
      parsed = JSON.parse(m[0]);
    } catch {
      return { findings: [], reason: "JSON parse failed even after extraction" };
    }
  }
  if (!Array.isArray(parsed)) return { findings: [], reason: "LLM output not a JSON array" };

  const out: (LlmFinding & { id: string })[] = [];
  parsed.slice(0, 5).forEach((r, i) => {
    const coerced = coerce(r as RawLlmOutput, i);
    if (coerced) out.push(coerced as LlmFinding & { id: string });
  });
  return { findings: out };
}
