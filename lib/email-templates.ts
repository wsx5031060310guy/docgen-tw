export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function emailShell(input: {
  preview: string;
  heading: string;
  body: string;
  footer: string;
}): string {
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(input.preview)}</title>
  </head>
  <body style="margin:0;padding:0;background:#F7F6F2;color:#27272A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans TC',sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F7F6F2;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid #E4E4E7;border-radius:12px;">
            <tr>
              <td style="padding:24px 32px;background:#1E2A5E;color:#FFFFFF;border-radius:11px 11px 0 0;font-size:20px;font-weight:700;line-height:1.4;">DocGen TW</td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 24px;color:#1E2A5E;font-size:24px;line-height:1.4;">${escapeHtml(input.heading)}</h1>
                ${input.body}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #E4E4E7;color:#52525B;font-size:12px;line-height:1.6;">${escapeHtml(input.footer)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderInviteEmail(input: {
  title: string;
  senderName: string;
  recipientName: string;
  signUrl: string;
  expiresNote?: string;
}): RenderedEmail {
  const subject = `[DocGen TW] ${input.senderName} 邀請你簽署「${input.title}」`;
  const expiresText = input.expiresNote ? `\n${input.expiresNote}\n\n` : "\n";
  const text =
    `${input.recipientName} 您好：\n\n` +
    `${input.senderName} 邀請你閱讀並簽署「${input.title}」。\n\n` +
    `前往閱讀並簽署：\n${input.signUrl}\n` +
    expiresText +
    `簽署頁可先下載草稿 PDF；完成後正式版 PDF 會寄到你填的信箱。\n\n` +
    `本郵件由 DocGen TW 系統代 ${input.senderName} 發送。`;

  const safeSignUrl = escapeHtml(input.signUrl);
  const expiresHtml = input.expiresNote
    ? `<p style="margin:0 0 16px;color:#52525B;font-size:14px;line-height:1.7;">${escapeHtml(input.expiresNote)}</p>`
    : "";
  const html = emailShell({
    preview: subject,
    heading: `邀請簽署「${input.title}」`,
    body: `
                <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">${escapeHtml(input.recipientName)} 您好：</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">${escapeHtml(input.senderName)} 邀請你閱讀並簽署「${escapeHtml(input.title)}」。</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="border-radius:8px;background:#1E2A5E;">
                      <a href="${safeSignUrl}" style="display:inline-block;padding:13px 22px;color:#FFFFFF;font-size:16px;font-weight:700;line-height:1.4;text-decoration:none;">前往閱讀並簽署</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;color:#52525B;font-size:13px;line-height:1.6;">若按鈕無法開啟，請複製以下連結：</p>
                <p style="margin:0 0 24px;font-size:13px;line-height:1.6;overflow-wrap:anywhere;word-break:break-all;"><a href="${safeSignUrl}" style="color:#1E2A5E;text-decoration:underline;">${safeSignUrl}</a></p>
                ${expiresHtml}
                <p style="margin:0;padding:16px;background:#F4F5FA;border-radius:8px;color:#3F3F46;font-size:14px;line-height:1.7;">簽署頁可先下載草稿 PDF；完成後正式版 PDF 會寄到你填的信箱。</p>`,
    footer: `本郵件由 DocGen TW 系統代 ${input.senderName} 發送。`,
  });

  return { subject, text, html };
}

export function renderCompletionEmail(input: {
  title: string;
  contractId: string;
  partyA: string;
  partyB: string;
  signedAt: Date | string;
  pdfAttached?: boolean;
}): RenderedEmail {
  const subject = `[DocGen TW] ${input.title} 已雙方簽署完成`;
  const signedAt = input.signedAt instanceof Date ? input.signedAt.toISOString() : input.signedAt;
  const pdfNote = input.pdfAttached === false
    ? "完整契約 PDF 可至 DocGen TW 合約頁面下載，依電子簽章法 §5 與紙本具同等效力。"
    : "完整契約 PDF 如附件，依電子簽章法 §5 與紙本具同等效力。";
  const text =
    `${input.title} 已由甲乙雙方完成電子簽署。\n\n` +
    `合約編號：${input.contractId}\n` +
    `甲方：${input.partyA}\n` +
    `乙方：${input.partyB}\n` +
    `簽署狀態：FULLY_SIGNED\n` +
    `完成時間：${signedAt}\n\n` +
    `${pdfNote}\n` +
    `本郵件由 DocGen TW 系統自動發送。`;
  const html = emailShell({
    preview: subject,
    heading: `${input.title} 已雙方簽署完成`,
    body: `
                <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">${escapeHtml(input.title)} 已由甲乙雙方完成電子簽署。</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0 0 24px;background:#F4F5FA;border-radius:8px;color:#3F3F46;font-size:14px;line-height:1.7;">
                  <tr><td style="padding:16px 16px 4px;font-weight:600;">合約編號</td><td style="padding:16px 16px 4px;word-break:break-all;">${escapeHtml(input.contractId)}</td></tr>
                  <tr><td style="padding:4px 16px;font-weight:600;">甲方</td><td style="padding:4px 16px;">${escapeHtml(input.partyA)}</td></tr>
                  <tr><td style="padding:4px 16px;font-weight:600;">乙方</td><td style="padding:4px 16px;">${escapeHtml(input.partyB)}</td></tr>
                  <tr><td style="padding:4px 16px;font-weight:600;">簽署狀態</td><td style="padding:4px 16px;">FULLY_SIGNED</td></tr>
                  <tr><td style="padding:4px 16px 16px;font-weight:600;">完成時間</td><td style="padding:4px 16px 16px;">${escapeHtml(signedAt)}</td></tr>
                </table>
                <p style="margin:0;font-size:14px;line-height:1.7;">${escapeHtml(pdfNote)}</p>`,
    footer: "本郵件由 DocGen TW 系統自動發送。",
  });

  return { subject, text, html };
}
