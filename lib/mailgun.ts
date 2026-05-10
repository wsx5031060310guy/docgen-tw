// Minimal Mailgun HTTP client. No SDK dep — just fetch + multipart form.
// Required env: MAILGUN_API_KEY, MAILGUN_DOMAIN. Optional: MAILGUN_FROM, MAILGUN_API_BASE.

const API_BASE_DEFAULT = "https://api.mailgun.net/v3";

function configured(): { apiKey: string; domain: string; from: string; base: string } | null {
  const apiKey = process.env.MAILGUN_API_KEY?.trim();
  const domain = process.env.MAILGUN_DOMAIN?.trim();
  if (!apiKey || !domain) return null;
  return {
    apiKey,
    domain,
    from: process.env.MAILGUN_FROM?.trim() || `DocGen TW <noreply@${domain}>`,
    base: (process.env.MAILGUN_API_BASE || API_BASE_DEFAULT).trim(),
  };
}

export type MailgunSendInput = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachment?: { filename: string; data: Buffer; contentType?: string };
};

export async function sendEmail(input: MailgunSendInput): Promise<{ ok: boolean; reason?: string }> {
  const cfg = configured();
  if (!cfg) return { ok: false, reason: "mailgun not configured (MAILGUN_API_KEY / MAILGUN_DOMAIN)" };

  const to = Array.isArray(input.to) ? input.to.join(", ") : input.to;
  const form = new FormData();
  form.append("from", cfg.from);
  form.append("to", to);
  form.append("subject", input.subject);
  if (input.text) form.append("text", input.text);
  if (input.html) form.append("html", input.html);
  if (input.attachment) {
    const blob = new Blob([new Uint8Array(input.attachment.data)], {
      type: input.attachment.contentType || "application/octet-stream",
    });
    form.append("attachment", blob, input.attachment.filename);
  }

  const res = await fetch(`${cfg.base}/${cfg.domain}/messages`, {
    method: "POST",
    headers: { authorization: "Basic " + Buffer.from(`api:${cfg.apiKey}`).toString("base64") },
    body: form,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, reason: `mailgun ${res.status}: ${body.slice(0, 200)}` };
  }
  return { ok: true };
}
