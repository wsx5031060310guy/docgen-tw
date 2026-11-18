import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { extractContractDraft, normalizeContractDraft } from "@/lib/ai-contract";
import { verifyLineSignature } from "@/lib/line";
import { TEMPLATES, getTemplate } from "@/lib/templates";

function mockModel(output: unknown) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(output) }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 1, text: 1, reasoning: undefined },
      },
      warnings: [],
    }),
  });
}

describe("AI contract draft", () => {
  it("validates LINE signatures and rejects tampering, missing or wrong-length signatures", () => {
    const body = '{"events":[]}';
    const signature = createHmac("sha256", "secret").update(body).digest("base64");
    expect(verifyLineSignature(body, signature, "secret")).toBe(true);
    expect(verifyLineSignature(`${body} `, signature, "secret")).toBe(false);
    expect(verifyLineSignature(body, signature, "other")).toBe(false);
    expect(verifyLineSignature(body, null, "secret")).toBe(false);
    expect(verifyLineSignature(body, "short", "secret")).toBe(false);
  });

  it("normalizes known fields, full-width numbers, selects, lengths and missing labels", () => {
    const longScope = "甲".repeat(2100);
    const draft = normalizeContractDraft({
      transcript: `  ${"逐".repeat(2100)}  `,
      templateId: " freelance ",
      fields: [
        { id: "unknown", value: "drop" },
        { id: "party_a_name", value: " 王公司 " },
        { id: "deliverable", value: "AI 原始檔，PDF 手冊" },
        { id: "scope", value: longScope },
        { id: "deadline", value: "2026/12/31" },
        { id: "amount", value: "120,000" },
        { id: "interest_rate", value: "１２０，０００" },
        { id: "penalty_rate", value: "NT$5,000元" },
        { id: "warranty_months", value: "三萬" },
        { id: "ip_owner", value: "invalid" },
      ],
    });
    expect(draft.templateId).toBe("freelance");
    expect(draft.values).toMatchObject({
      party_a_name: "王公司",
      deliverable: "AI 原始檔，PDF 手冊", // prose keeps full-width punctuation
      amount: "120000",
      interest_rate: "120000",
      penalty_rate: "5000",
    });
    expect(draft.values).not.toHaveProperty("unknown");
    expect(draft.values).not.toHaveProperty("warranty_months");
    expect(draft.values).not.toHaveProperty("ip_owner");
    expect(draft.values.scope).toHaveLength(2000);
    expect(draft.transcript).toHaveLength(2000);
    expect(draft.missing).toEqual(["承攬人（乙方）姓名 / 公司"]);
  });

  it("does not report required fields already filled by template defaults", () => {
    const draft = normalizeContractDraft({
      transcript: "催款",
      templateId: "dunning",
      fields: [
        { id: "party_a_name", value: "甲" },
        { id: "party_b_name", value: "乙" },
        { id: "contract_subject", value: "服務費" },
        { id: "original_due_date", value: "2026/11/01" },
        { id: "amount_owed", value: "5000" },
      ],
    });
    expect(draft.missing).toEqual([]);
    expect(draft.values).not.toHaveProperty("grace_days");
  });

  it("drops self-references the model filled in as a party name", () => {
    // Seen in a real gemini-3.1-flash-lite run: 「王小明跟我借 20 萬」→ party_a_name「我」.
    const draft = normalizeContractDraft({
      transcript: "王小明跟我借 20 萬",
      templateId: "loan",
      fields: [
        { id: "party_a_name", value: "我" },
        { id: "party_b_name", value: "王小明" },
        { id: "amount", value: "200000" },
      ],
    });
    expect(draft.values).toEqual({ party_b_name: "王小明", amount: "200000" });
    expect(draft.missing).toContain(getTemplate("loan")!.fields.find((f) => f.id === "party_a_name")!.label);
  });

  it("drops all values for an unknown template", () => {
    expect(normalizeContractDraft({
      transcript: "x",
      templateId: "made-up",
      fields: [{ id: "party_a_name", value: "甲" }],
    })).toEqual({ transcript: "x", templateId: null, values: {}, missing: [] });
  });

  it("sends an unbounded JSON schema and a system prompt containing every template id", async () => {
    let responseFormat: unknown;
    let prompt: unknown;
    const fallback = mockModel({ transcript: "x", templateId: "", fields: [] });
    const model = new MockLanguageModelV4({
      doGenerate: async (options) => {
        responseFormat = options.responseFormat;
        prompt = options.prompt;
        return fallback.doGenerate(options);
      },
    });
    await extractContractDraft({ text: "x", model });
    expect((responseFormat as { type?: string })?.type).toBe("json");
    const schema = JSON.stringify((responseFormat as { schema?: unknown })?.schema);
    for (const keyword of [
      "maxItems",
      "minItems",
      "maxLength",
      "minLength",
      "minimum",
      "maximum",
      "format",
      "pattern",
      "enum",
    ]) {
      expect(schema, `schema must not use ${keyword}`).not.toContain(`"${keyword}"`);
    }
    const system = JSON.stringify(prompt);
    for (const template of TEMPLATES) expect(system).toContain(template.id);
  });
});
