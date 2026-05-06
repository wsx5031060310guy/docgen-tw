// Smart Router client - all LLM calls in this repo should go through here
// so model swaps / rate-limit fallback happen in one place.
const ROUTER_URL = process.env.SMART_ROUTER_URL || 'http://127.0.0.1:8765';

export type Tier = 'critical' | 'daily' | 'cheap' | 'free';

export async function chat(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  opts: { tier?: Tier; model?: string } = {}
): Promise<string> {
  const { tier = 'daily', model } = opts;
  let chosen = model;
  if (!chosen) {
    const r = await fetch(`${ROUTER_URL}/route?tier=${tier}`);
    chosen = (await r.json()).model;
  }
  const res = await fetch(`${ROUTER_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: chosen, messages }),
  });
  if (!res.ok) throw new Error(`router ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
