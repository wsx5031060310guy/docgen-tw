"use client";
import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { Icon } from "@/components/Icon";
import { SignaturePad } from "@/components/SignaturePad";
import { ContractPreview } from "@/components/ContractPreview";
import { getTemplate, TEMPLATES } from "@/lib/templates";

interface ContractData {
  id: string;
  templateId: string;
  signingStatus: string;
  senderName?: string;
  recipientName?: string | null;
  values: Record<string, string>;
  senderSignatureUrl?: string | null;
  recipientSignatureUrl?: string | null;
  fullySigned?: boolean;
}

function SignInner({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [data, setData] = useState<ContractData | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [sigB, setSigB] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/contracts/${id}/sign-fetch?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        setData(j as ContractData);
        if (j.recipientName) setName(j.recipientName);
        if (j.fullySigned) setSigned(true);
      })
      .catch((e) => setLoadErr((e as Error).message));
  }, [id, token]);

  if (!token) {
    return (
      <div className="container-narrow" style={{ padding: 40 }}>
        <div className="card" style={{ padding: 24, background: "var(--red-50)", color: "var(--red-600)", border: "1px solid #fecaca" }}>
          簽署連結缺少 token。請向發送方索取完整連結。
        </div>
      </div>
    );
  }
  if (loadErr) {
    return (
      <div className="container-narrow" style={{ padding: 40 }}>
        <div className="card" style={{ padding: 24, background: "var(--red-50)", color: "var(--red-600)", border: "1px solid #fecaca" }}>
          無法載入合約：{loadErr}
          <br />
          <span style={{ fontSize: 12, opacity: 0.85 }}>請確認連結是否完整或已過期。</span>
        </div>
      </div>
    );
  }
  if (!data) {
    return <div style={{ padding: 40 }}>載入合約中…</div>;
  }

  const tpl = getTemplate(data.templateId) || TEMPLATES[0];
  const sigA = data.senderSignatureUrl || "";
  const senderDisplayName = data.senderName || data.values?.party_a_name || "—";
  const clauseCount = tpl.clauses(data.values).length;
  const lawCount = new Set(tpl.clauses(data.values).flatMap((c) => c.ref)).size;

  async function submit() {
    if (!sigB) return;
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/contracts/${id}/recipient-sign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, signature: sigB, recipientName: name || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "簽署失敗");
      setSigned(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (signed) {
    return (
      <div className="page" style={{ minHeight: "calc(100vh - 60px)", display: "grid", placeItems: "center", padding: 40, background: "var(--green-50)" }}>
        <div className="card fade-in" style={{ padding: 48, textAlign: "center", maxWidth: 520 }}>
          <div className="pulse-ring" style={{
            width: 72, height: 72, borderRadius: "50%", background: "var(--green-500)", color: "#fff",
            display: "grid", placeItems: "center", margin: "0 auto 18px",
          }}>
            <Icon name="check" size={32} stroke={3} />
          </div>
          <h2>合約已雙方簽署完成</h2>
          <p style={{ color: "var(--ink-soft)", marginTop: 8 }}>系統已將正式版本寄送至雙方信箱。</p>
          <div className="row gap-3" style={{ justifyContent: "center", marginTop: 24 }}>
            <a className="btn btn-stamp btn-lg" href={`/api/contracts/${id}/pdf?token=${encodeURIComponent(token)}`} target="_blank" rel="noopener noreferrer">
              <Icon name="download" size={14} />下載 PDF
            </a>
            <button className="btn btn-ghost" onClick={() => router.push("/")}>回首頁</button>
          </div>
          <div style={{
            marginTop: 26, padding: 12, background: "var(--bg-soft)", borderRadius: 6,
            fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-muted)", textAlign: "left",
          }}>
            <div>合約編號 #{id}</div>
            <div>簽署時間 {new Date().toISOString().slice(0, 19).replace("T", " ")}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ background: "var(--bg-soft)", minHeight: "calc(100vh - 60px)" }}>
      <div className="container-narrow" style={{ padding: "32px 24px 200px" }}>
        <div className="card" style={{ padding: 18, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div className="row gap-3">
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: "var(--primary-soft)", color: "var(--primary)",
              display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: 600,
            }}>
              {senderDisplayName.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>由 {senderDisplayName} 寄送給你</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>
                {tpl.name}
              </div>
            </div>
          </div>
          <span className="chip chip-warn">
            <Icon name="clock" size={12} />等候你簽署
          </span>
        </div>

        <div role="alert" style={{
          padding: "14px 18px", marginBottom: 18, borderRadius: "var(--radius)",
          background: "#fff7ed", border: "1px solid #fdba74", color: "#7c2d12",
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <Icon name="alert" size={18} style={{ color: "#ea580c", marginTop: 2 }} />
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            簽署即代表你已詳閱本合約全部條款並同意接受拘束。系統將自動留存你的 IP 位址、簽署時間戳記及簽名圖檔雜湊值，依《電子簽章法》第
            4、9 條，與紙本簽署具同等效力。
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            padding: "10px 16px", borderBottom: "1px solid var(--line)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "var(--bg-elev)",
          }}>
            <div className="row gap-2" style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
              <Icon name="fileText" size={13} />合約預覽 · {clauseCount} 條 · {lawCount} 法令依據
            </div>
          </div>
          <div style={{ maxHeight: 540, overflowY: "auto", background: "#f1eadb" }}>
            <ContractPreview template={tpl} values={data.values} sigA={sigA} sigB={sigB} stamp={false} scale={0.85} />
          </div>
        </div>
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
        background: "color-mix(in oklab, var(--bg-elev) 95%, transparent)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid var(--line)",
        boxShadow: "0 -8px 24px rgba(20,29,68,0.08)",
        padding: "16px 24px",
      }}>
        <div className="container-narrow dg-sign-bottom-grid">
          <div className="field">
            <label className="field-label">
              姓名 / 公司 <span className="field-required">*</span>
            </label>
            <input
              className="input"
              placeholder={data.recipientName || "請輸入"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <SignaturePad label="在此簽名" value={sigB} onChange={setSigB} height={88} />
          </div>
          <button
            className="btn btn-stamp btn-lg"
            disabled={!name || !sigB || submitting}
            style={{ height: "fit-content", alignSelf: "flex-end" }}
            onClick={submit}
          >
            <Icon name="fileSig" size={15} />
            {submitting ? "簽署中…" : "正式簽署"}
          </button>
        </div>
        {err && (
          <div className="container-narrow" style={{ marginTop: 8 }}>
            <span className="field-error">
              <Icon name="alert" size={11} /> {err}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <>
      <TopNav />
      <Suspense fallback={<div style={{ padding: 40 }}>載入中…</div>}>
        <SignInner id={id} />
      </Suspense>
    </>
  );
}
