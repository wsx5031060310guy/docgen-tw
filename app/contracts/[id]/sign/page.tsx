"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ContractPreview } from "@/components/ContractPreview";
import { Icon } from "@/components/Icon";
import { SignaturePad } from "@/components/SignaturePad";
import { SignTopBar } from "@/components/SignTopBar";
import { Stepper } from "@/components/Stepper";
import { isValidEmail } from "@/lib/email";
import { contractTitle, getTemplate, TEMPLATES } from "@/lib/templates";

interface ContractData {
  id: string;
  templateId: string;
  signingStatus: string;
  senderName?: string;
  recipientName?: string | null;
  recipientEmail?: string | null;
  values: Record<string, string>;
  senderSignatureUrl?: string | null;
  recipientSignatureUrl?: string | null;
  recipientSignedAt?: string | null;
  fullySigned?: boolean;
}

const SIGN_STEPS = ["閱讀合約", "填寫資料", "簽名送出"];

function SignSkeleton() {
  return (
    <main className="dg-sign-state-page" aria-busy="true" aria-label="載入合約中">
      <div className="card dg-sign-skeleton-card">
        <span className="dg-sign-skeleton-line dg-sign-skeleton-line-short" />
        <span className="dg-sign-skeleton-line" />
        <span className="dg-sign-skeleton-line dg-sign-skeleton-line-medium" />
      </div>
    </main>
  );
}

function SenderSummary({ sender, title }: { sender: string; title: string }) {
  return (
    <div className="dg-sign-sender">
      <div className="dg-sign-avatar" aria-hidden="true">
        {sender.charAt(0)}
      </div>
      <div className="dg-sign-sender-copy">
        <div className="dg-sign-eyebrow">由 {sender} 寄送給你</div>
        <div className="dg-sign-contract-title">{title}</div>
        <span className="chip chip-warn dg-sign-status-chip">
          <Icon name="clock" size={12} />
          等候你簽署
        </span>
      </div>
    </div>
  );
}

function LegalNotice() {
  return (
    <div className="dg-sign-legal-note">
      <Icon name="shield" size={15} />
      <span>
        簽署即代表你已詳閱本合約全部條款並同意接受拘束。系統將自動留存你的 IP 位址、簽署時間戳記及簽名圖檔雜湊值，依《電子簽章法》第
        4、9 條，與紙本簽署具同等效力。
      </span>
    </div>
  );
}

function SignInner({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const signatureRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<ContractData | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [sigB, setSigB] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [documentExpanded, setDocumentExpanded] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/contracts/${id}/sign-fetch?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        setData(j as ContractData);
        if (j.recipientName) setName(j.recipientName);
        if (j.recipientEmail) setEmail(j.recipientEmail);
        if (j.fullySigned) {
          setSignedAt(j.recipientSignedAt ?? null);
          setSigned(true);
        }
      })
      .catch((e) => setLoadErr((e as Error).message));
  }, [id, token]);

  if (!token) {
    return (
      <main className="dg-sign-state-page">
        <div className="card dg-sign-message dg-sign-message-error" role="alert">
          簽署連結缺少 token。請向發送方索取完整連結。
        </div>
      </main>
    );
  }

  if (loadErr) {
    return (
      <main className="dg-sign-state-page">
        <div className="card dg-sign-message dg-sign-message-error" role="alert">
          無法載入合約：{loadErr}
          <span>請確認連結是否完整或已過期。</span>
        </div>
      </main>
    );
  }

  if (!data) return <SignSkeleton />;

  const tpl = getTemplate(data.templateId) || TEMPLATES[0];
  const sigA = data.senderSignatureUrl || "";
  const senderDisplayName = data.senderName || data.values?.party_a_name || "—";
  const title = contractTitle(data.templateId, data.values);
  const clauseCount = tpl.clauses(data.values).length;
  const lawCount = new Set(tpl.clauses(data.values).flatMap((c) => c.ref)).size;
  const hasRecipientEmail = Boolean(data.recipientEmail);
  const nameInvalid = Boolean(err && (err.includes("姓名") || err.includes("公司")));
  const emailInvalid = Boolean(err?.includes("電子郵件"));
  const currentStep = sigB
    ? 2
    : name.trim() && (hasRecipientEmail || isValidEmail(email))
      ? 1
      : 0;

  async function submit() {
    if (!sigB) {
      setErr("請先在簽名板簽名");
      signatureRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const recipientEmail = email.trim();
    if ((!hasRecipientEmail || recipientEmail) && !isValidEmail(recipientEmail)) {
      setErr("請填寫有效的電子郵件，簽署完成通知將寄到此信箱");
      return;
    }

    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/contracts/${id}/recipient-sign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          signature: sigB,
          recipientName: name || undefined,
          recipientEmail: recipientEmail || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "簽署失敗");
      setSignedAt(json.recipientSignedAt ?? null);
      setSigned(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (signed) {
    const signedAtDisplay = signedAt
      ? new Date(signedAt)
          .toLocaleString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
          .replaceAll("/", "-")
      : "—";
    const deliveryEmail = email.trim() || data.recipientEmail;

    return (
      <main className="dg-sign-success-page">
        <div className="card fade-in dg-sign-success-card">
          <div className="pulse-ring dg-sign-success-icon">
            <Icon name="check" size={32} stroke={3} />
          </div>
          <h2>合約已雙方簽署完成</h2>
          <p className="dg-sign-success-copy">
            正式版 PDF 已附在完成通知信寄到雙方信箱；也可在此下載，或日後再開這個連結下載。
          </p>
          {deliveryEmail && <p className="dg-sign-success-email">已寄至 {deliveryEmail}</p>}
          <div className="dg-sign-success-actions">
            <div>
              <a
                className="btn btn-stamp btn-lg"
                href={`/api/contracts/${id}/pdf?token=${encodeURIComponent(token)}`}
                download={`docgen-${id}.pdf`}
              >
                <Icon name="download" size={14} />下載 PDF
              </a>
              <div className="dg-sign-success-hint">產生 PDF 約需數秒</div>
            </div>
            <a
              className="btn btn-ghost"
              href={`/api/contracts/${id}/pdf?token=${encodeURIComponent(token)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              在瀏覽器開啟
            </a>
            <button className="btn btn-ghost" onClick={() => router.push("/")}>回首頁</button>
          </div>
          <div className="dg-sign-success-meta">
            <div>合約編號 #{id}</div>
            <div>簽署時間 {signedAtDisplay}</div>
          </div>
        </div>
      </main>
    );
  }

  const signatureButtonLabel = submitting ? "簽署中…" : "正式簽署";

  return (
    <div className="page dg-sign-page">
      <main className="dg-sign-main">
        <section className="card dg-sign-mobile-sender-card">
          <SenderSummary sender={senderDisplayName} title={title} />
          <div className="dg-sign-mobile-stepper">
            <Stepper steps={SIGN_STEPS} current={currentStep} />
          </div>
        </section>

        <div className="dg-sign-layout">
          <section className="card dg-sign-document-card" aria-label="合約預覽">
            <header className="dg-sign-document-header">
              <div className="dg-sign-document-label">
                <Icon name="fileText" size={13} />
                合約預覽 · {clauseCount} 條 · {lawCount} 法令依據
              </div>
              <div className="dg-sign-document-actions">
                <a
                  className="btn btn-ghost btn-sm"
                  href={`/api/contracts/${id}/pdf?token=${encodeURIComponent(token)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="download" size={13} />下載草稿 PDF
                </a>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm dg-sign-document-toggle"
                  aria-expanded={documentExpanded}
                  onClick={() => setDocumentExpanded((value) => !value)}
                >
                  {documentExpanded ? "收合" : "展開全文"}
                </button>
              </div>
            </header>
            <div className={`dg-sign-document-body ${documentExpanded ? "dg-sign-document-body-expanded" : ""}`}>
              <ContractPreview
                template={tpl}
                values={data.values}
                sigA={sigA}
                sigB={sigB}
                stamp={false}
                scale={1}
              />
            </div>
          </section>

          <aside className="dg-sign-action-column">
            <section className="card dg-sign-action-card" aria-label="簽署資料">
              <div className="dg-sign-desktop-summary">
                <SenderSummary sender={senderDisplayName} title={title} />
              </div>
              <div className="dg-sign-desktop-stepper">
                <Stepper steps={SIGN_STEPS} current={currentStep} />
              </div>

              <div className="dg-sign-form-fields">
                <div className="field">
                  <label className="field-label" htmlFor="recipient-name">姓名／公司</label>
                  <input
                    id="recipient-name"
                    className={`input ${nameInvalid ? "error" : ""}`}
                    autoComplete="name"
                    aria-invalid={nameInvalid}
                    placeholder={data.recipientName || "請輸入"}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  <div className="field-help">將顯示於合約乙方簽署欄</div>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="recipient-email">
                    電子郵件
                    {!hasRecipientEmail && <span className="field-required">*</span>}
                  </label>
                  <input
                    id="recipient-email"
                    type="email"
                    className={`input ${emailInvalid ? "error" : ""}`}
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={emailInvalid}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <div className="field-help">簽署完成通知與正式版 PDF 會寄到這裡</div>
                </div>
              </div>

              <div ref={signatureRef} className="dg-sign-signature-target">
                <SignaturePad
                  label="親筆簽名"
                  value={sigB}
                  onChange={(value) => {
                    setSigB(value);
                    if (value && err === "請先在簽名板簽名") setErr(null);
                  }}
                  height={104}
                />
              </div>

              <LegalNotice />

              {err && (
                <div className="field-error dg-sign-error" role="alert">
                  <Icon name="alert" size={13} />
                  {err}
                </div>
              )}

              <button
                type="button"
                className="btn btn-stamp btn-lg dg-sign-submit dg-sign-desktop-submit"
                disabled={!sigB || submitting}
                aria-disabled={!sigB || submitting}
                onClick={submit}
              >
                <Icon name="fileSig" size={15} />
                {signatureButtonLabel}
              </button>
              <p className="dg-sign-after-note">
                簽署後正式版 PDF 會寄到你的信箱，也可在此下載。
              </p>
            </section>
          </aside>
        </div>
      </main>

      <div className="dg-sign-mobile-submit-bar">
        <div className="dg-sign-mobile-submit-inner">
          <p>{sigB ? "已簽名，可送出" : "請先在下方簽名"}</p>
          <button
            type="button"
            className="btn btn-stamp btn-lg dg-sign-submit"
            disabled={submitting}
            aria-disabled={submitting}
            onClick={submit}
          >
            <Icon name="fileSig" size={15} />
            {signatureButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <>
      <SignTopBar />
      <Suspense fallback={<SignSkeleton />}>
        <SignInner id={id} />
      </Suspense>
    </>
  );
}
