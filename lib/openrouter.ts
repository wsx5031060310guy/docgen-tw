// Minimal OpenRouter chat client. Used only for the optional LLM-augmented
// risk check on /check — the bulk of risk detection still happens rule-based
// so the feature degrades gracefully when no API key is configured.
//
// Env:
//   OPENROUTER_API_KEY   required
//   OPENROUTER_MODEL     optional, default 'google/gemini-2.5-pro:free'
//
// We deliberately route through OpenRouter rather than Google direct so the
// caller pays once for many providers (memory: free :free tier covers text).

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function openrouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export async function openrouterChat(
  messages: OpenRouterMessage[],
  opts: { model?: string; timeoutMs?: number; maxTokens?: number } = {},
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new Error("OPENROUTER_API_KEY not set");
  const model =
    opts.model || process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-pro:free";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25_000);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://docgen-tw.vercel.app",
        "X-Title": "DocGen TW",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts.maxTokens ?? 800,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`openrouter ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timer);
  }
}
