"use client";
import { Suspense, use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { Icon } from "@/components/Icon";
import { SignaturePad } from "@/components/SignaturePad";
import { ContractPreview } from "@/components/ContractPreview";
import { TEMPLATES } from "@/lib/templates";
import { todayMinguo } from "@/lib/numberToChinese";

function SignInner({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const tpl = TEMPLATES[0];

  // Demo values for the freelance contract preview shown to the recipient.
  // In a real implementation these would be fetched by id+token from the API.
  const demoValues = {
    party_a_name: "某某創意有限公司",
    party_a_id: "12345678",
    party_b_name: "陳設計",
    party_b_id: "A123456789",
    scope: "品牌識別系統設計，含 logo 主視覺、配色與字型規範手冊",
    deliverable: "AI 原始檔、PDF 規範手冊各一份",
    deadline: "2026/06/30",
    amount: "120000",
    payment_terms: "完工驗收後 14 日內一次給付",
    ip_owner: "a",
    penalty_rate: "0.1",
    sign_date: todayMinguo(),
  };
  const sigA =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'><path d='M10 40 Q 30 5, 50 35 T 100 30 T 150 35 T 190 25' fill='none' stroke='%231E2A5E' stroke-width='2.5' stroke-linecap='round'/></svg>`
    );

  const [sigB, setSigB] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="container-narrow" style={{ padding: 40 }}>
        <div
          className="card"
          style={{ padding: 24, background: "var(--red-50)", color: "var(--red-600)", border: "1px solid #fecaca" }}
        >
          簽署連結缺少 token。請向發送方索取完整連結。
        </div>
      </div>
    );
  }

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
      <div
        className="page"
        style={{
          minHeight: "calc(100vh - 60px)",
          display: "grid",
          placeItems: "center",
          padding: 40,
          background: "var(--green-50)",
        }}
      >
        <div className="card fade-in" style={{ padding: 48, textAlign: "center", maxWidth: 520 }}>
          <div
            className="pulse-ring"
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "var(--green-500)", color: "#fff",
              display: "grid", placeItems: "center", margin: "0 auto 18px",
            }}
          >
            <Icon name="check" size={32} stroke={3} />
          </div>
          <h2>合約已雙方簽署完成</h2>
          <p style={{ color: "var(--ink-soft)", marginTop: 8 }}>系統已將正式版本寄送至雙方信箱。</p>
          <div className="row gap-3" style={{ justifyContent: "center", marginTop: 24 }}>
            <button className="btn btn-stamp btn-lg">
              <Icon name="download" size={14} />
              下載 PDF
            </button>
            <button className="btn btn-ghost" onClick={() => router.push("/")}>
              回首頁
            </button>
          </div>
          <div
            style={{
              marginTop: 26, padding: 12, background: "var(--bg-soft)", borderRadius: 6,
              fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-muted)", textAlign: "left",
            }}
          >
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
        <div
          className="card"
          style={{ padding: 18, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div className="row gap-3">
            <div
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: "var(--primary-soft)", color: "var(--primary)",
                display: "grid", placeItems: "center",
                fontFamily: "var(--font-display)", fontWeight: 600,
              }}
            >
              某
            </div>
            <div>
              <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>由 某某創意有限公司 寄送給你</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>
                承攬合約 · 品牌識別系統設計
              </div>
            </div>
          </div>
          <span className="chip chip-warn">
            <Icon name="clock" size={12} />等候你簽署
          </span>
        </div>

        <div
          role="alert"
          style={{
            padding: "14px 18px", marginBottom: 18, borderRadius: "var(--radius)",
            background: "#fff7ed", border: "1px solid #fdba74", color: "#7c2d12",
            display: "flex", gap: 12, alignItems: "flex-start",
          }}
        >
          <Icon name="alert" size={18} style={{ color: "#ea580c", marginTop: 2 }} />
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            簽署即代表你已詳閱本合約全部條款並同意接受拘束。系統將自動留存你的 IP 位址、簽署時間戳記及簽名圖檔雜湊值，依《電子簽章法》第
            4、9 條，與紙本簽署具同等效力。
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "10px 16px", borderBottom: "1px solid var(--line)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "var(--bg-elev)",
            }}
          >
            <div className="row gap-2" style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
              <Icon name="fileText" size={13} />合約預覽 · 9 條 · 5 法令依據
            </div>
            <button className="btn btn-soft btn-sm">
              <Icon name="download" size={12} />下載草稿
            </button>
          </div>
          <div style={{ maxHeight: 540, overflowY: "auto", background: "#f1eadb" }}>
            <ContractPreview template={tpl} values={demoValues} sigA={sigA} sigB={sigB} stamp={false} scale={0.85} />
          </div>
        </div>
      </div>

      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
          background: "color-mix(in oklab, var(--bg-elev) 95%, transparent)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid var(--line)",
          boxShadow: "0 -8px 24px rgba(20,29,68,0.08)",
          padding: "16px 24px",
        }}
      >
        <div
          className="container-narrow"
          style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: 18, alignItems: "flex-end" }}
        >
          <div className="field">
            <label className="field-label">
              姓名 / 公司 <span className="field-required">*</span>
            </label>
            <input
              className="input"
              placeholder="陳設計"
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
