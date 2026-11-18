import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import { TEMPLATES, getTemplate } from "./templates";

export const AI_MODEL = "google/gemini-3.1-flash-lite";
export const AI_DAILY_LIMIT = 30;
export const AI_TEXT_MAX = 1000;

export type AiContractDraft = {
  transcript: string;
  templateId: string | null;
  values: Record<string, string>;
  missing: string[];
};

const draftSchema = z.object({
  transcript: z.string().describe("語音的逐字稿；文字輸入就照抄原文"),
  templateId: z.string().describe(
    "合約類型 id，只能是：" + TEMPLATES.map((template) => `${template.id}（${template.name}）`).join("、") + "；看不出來填空字串",
  ),
  fields: z.array(z.object({
    id: z.string().describe("欄位 id"),
    value: z.string().describe("欄位值，一律字串"),
  })).describe("使用者有提到的欄位；沒提到的不要放"),
});

const templateGuide = TEMPLATES.map((template) => {
  const fields = template.fields.map((field) => {
    const annotations = [
      field.type === "number" ? "數字" : "",
      field.options?.length
        ? `選項 ${field.options.map((option) => `${option.value}=${option.label}`).join("、")}`
        : "",
      field.required ? "必填" : "",
    ].filter(Boolean);
    return `- ${field.id}：${field.label}${annotations.length ? `（${annotations.join("；")}）` : ""}`;
  });
  return `### ${template.id}：${template.name}\n${fields.join("\n")}`;
}).join("\n\n");

const SYSTEM = `你是台灣合約助理，從使用者的一句話或語音判斷合約類型並擷取欄位。

${templateGuide}

規則：
- 金額一律新台幣整數阿拉伯數字（「12萬」=120000、「五千五」=5500、「1.5萬」=15000），不含逗號、單位。百分比、天數、月數只填數字。
- 日期一律西元 YYYY/MM/DD；「月底」「下個月 15 號」依今天日期換算。
- 依範本角色判斷甲乙方（例：承攬合約甲方是定作人＝出錢的人；使用者說自己是接案方，使用者就是乙方）。不確定就照使用者說的名字填，不要自行對調。
- 不可捏造統編、身分證字號、Email、地址、電話；沒提到就不要放。
- 使用者用「我」「我們」「本公司」指自己時，不要把這些字填成姓名，該方姓名留空讓使用者補。
- 使用者沒講的條款（違約金、管轄法院、保固等）不要放，系統用預設值。
- 看不出合約類型，templateId 填空字串。`;

const SELF_REFERENCES = new Set(["我", "我們", "本人", "本公司", "敝公司", "自己"]);

const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

function halfWidth(value: string): string {
  return value
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replaceAll("．", ".")
    .replaceAll("，", ",")
    .replaceAll("％", "%");
}

export function taipeiDate(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
}

export function normalizeContractDraft(raw: unknown): AiContractDraft {
  const candidate = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const templateId = text(candidate.templateId, 100);
  const template = getTemplate(templateId);
  const transcript = text(candidate.transcript, 2000);
  if (!template) return { transcript, templateId: null, values: {}, missing: [] };

  const fieldMap = new Map(template.fields.map((field) => [field.id, field]));
  const values: Record<string, string> = {};
  const fields = Array.isArray(candidate.fields) ? candidate.fields : [];
  for (const item of fields) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = text(row.id, 200);
    const field = fieldMap.get(id);
    if (!field) continue;
    let value = text(row.value, field.type === "textarea" ? 2000 : 200);
    // Real-model run filled the lender as「我」; a pronoun is never a party name.
    if (!value || SELF_REFERENCES.has(value)) continue;
    if (field.type === "number") {
      // Half-width only here: prose fields keep their Chinese punctuation (，).
      value = halfWidth(value).replace(/NT\$/gi, "").replace(/[,\s元%]/g, "");
      if (!/^\d+(\.\d+)?$/.test(value) || Number(value) > 1e12) continue;
    }
    if (field.type === "select" && !field.options?.some((option) => option.value === value)) continue;
    values[id] = value;
  }

  const merged = { ...template.defaults, ...values };
  const missing = template.fields
    .filter((field) => field.required && !String(merged[field.id] ?? "").trim())
    .map((field) => field.label);
  return { transcript, templateId: template.id, values, missing };
}

export async function extractContractDraft(input: {
  text?: string;
  audio?: { data: Uint8Array; mediaType: string };
  model?: LanguageModel;
  now?: Date;
}): Promise<AiContractDraft> {
  const now = input.now ?? new Date();
  const content: (
    | { type: "text"; text: string }
    | { type: "file"; mediaType: string; data: Uint8Array }
  )[] = [{ type: "text", text: `今天是 ${taipeiDate(now)}。` }];
  if (input.audio) {
    content.push({ type: "text", text: "以下是使用者的語音，先轉成逐字稿再擷取合約欄位：" });
    content.push({ type: "file", mediaType: input.audio.mediaType, data: input.audio.data });
  } else {
    content.push({ type: "text", text: `使用者輸入：${text(input.text, AI_TEXT_MAX)}` });
  }

  const { output } = await generateText({
    model: input.model ?? AI_MODEL,
    system: SYSTEM,
    messages: [{ role: "user", content }],
    output: Output.object({ schema: draftSchema }),
    temperature: 0,
    maxOutputTokens: 4096,
    abortSignal: AbortSignal.timeout(40_000),
  });
  return normalizeContractDraft(output);
}
