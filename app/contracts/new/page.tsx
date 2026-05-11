"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { Stepper } from "@/components/Stepper";
import { Icon } from "@/components/Icon";
import { ContractPreview } from "@/components/ContractPreview";
import { SignaturePad } from "@/components/SignaturePad";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { RiskCheckPanel } from "@/components/RiskCheckPanel";
import { AttachToCaseModal } from "@/components/AttachToCaseModal";
import { BillingBanner } from "@/components/BillingBanner";
import Link from "next/link";
import { TEMPLATES, getTemplate, type Values } from "@/lib/templates";
import { LEGAL } from "@/lib/legal";

function NewInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tplParam = params.get("tpl") || TEMPLATES[0].id;
  const fromMilestone = params.get("fromMilestone");

  const [tplId, setTplId] = useState<string>(tplParam);
  const tpl = getTemplate(tplId) || TEMPLATES[0];
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Values>({ ...tpl.defaults });
  const [prefillBanner, setPrefillBanner] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLegal, setShowLegal] = useState(false);
  const [sigA, setSigA] = useState("");
  const [sigB, setSigB] = useState("");
  const [signedA, setSignedA] = useState("");
  const [signedB, setSignedB] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [recipientUrl, setRecipientUrl] = useState<string | null>(null);
  const [signingToken, setSigningToken] = useState<string | null>(null);

  useEffect(() => {
    setValues({ ...tpl.defaults });
    setErrors({});
  }, [tplId]);

  // Prefill from a milestone (e.g., overdue → 催款通知書)
  useEffect(() => {
    if (!fromMilestone) return;
    (async () => {
      try {
        const r = await fetch(`/api/milestones/${fromMilestone}/dunning-prefill`);
        if (!r.ok) return;
        const j = await r.json();
        if (j.templateId) setTplId(j.templateId);
        if (j.values) {
          // Apply after the tplId-change effect resets defaults, so values win.
          setTimeout(() => setValues((cur) => ({ ...cur, ...j.values })), 0);
        }
        setPrefillBanner("已從逾期項目自動帶入收件人 / 金額 / 原約定到期日。請覆核後送出。");
        setStep(2);
      } catch {
        // silent; user can fill manually
      }
    })();
  }, [fromMilestone]);

  const setVal = (k: string, v: string) => {
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k]) {
      setErrors((e) => {
        const n = { ...e };
        delete n[k];
        return n;
      });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    tpl.fields.forEach((f) => {
      if (f.required && !String(values[f.id] || "").trim()) e[f.id] = "此欄位為必填";
    });
    if (tpl.id === "loan" && parseFloat(values.rate || "0") > 16) e.rate = "依民法 §205，年利率不得逾 16%";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const groupedFields = useMemo(() => {
    const g: Record<string, typeof tpl.fields> = {};
    tpl.fields.forEach((f) => {
      const k = f.group || "main";
      if (!g[k]) g[k] = [];
      g[k].push(f);
    });
    return g;
  }, [tpl]);

  async function submitToAPI() {
    setSubmitting(true);
    setSubmitErr(null);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          templateId: tpl.id,
          values,
          partyASignature: sigA,
          recipientName: values.party_b_name,
        }),
      });
      const json = await res.json();
      if (res.status === 402 && json.quotaExceeded) {
        throw new Error("本月免費額度 (3 份) 已用完。請升級 Pro 方案以解鎖無限合約。");
      }
      if (!res.ok) throw new Error(json.error || "送出失敗");
      setContractId(json.id);
      setRecipientUrl(json.recipientSignUrl || null);
      setSigningToken(json.signingToken || null);
    } catch (e) {
      setSubmitErr((e as Error).message);
      throw e;
    } finally {
      setSubmitting(false);
    }
  }

  const proceed = async () => {
    if (step === 2 && !validate()) return;
    if (step === 3 && (!sigA || !sigB)) return;
    if (step === 3) {
      try {
        await submitToAPI();
      } catch {
        return;
      }
      const t = new Date().toISOString().replace("T", " ").slice(0, 19);
      setSignedA(`${t} · IP 203.69.x.x · #${hashStub(sigA)}`);
      setSignedB(`${t} · IP 114.32.x.x · #${hashStub(sigB)}`);
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const stepNames = ["選模板", "填資訊", "簽名", "完成"];

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 60px)" }}>
      <div style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-elev)", padding: "14px 32px" }}>
        <div className="container row" style={{ justifyContent: "space-between" }}>
          <Stepper steps={stepNames} current={step - 1} />
          <div className="row gap-3 dg-autosave-indicator" style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
            <Icon name="save" size={13} /> 自動儲存於本機
          </div>
        </div>
      </div>

      {step < 4 ? (
        <div className="dg-newcontract-grid">
          <div className="dg-newcontract-form">
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <BillingBanner />
                <div>
                  <h2 style={{ fontSize: 24 }}>步驟 1 · 選擇合約類型</h2>
                  <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 4 }}>
                    不同類型適用不同民法章節，選錯不影響，後面隨時可換。
                  </p>
                </div>
                <div className="dg-templates-pick">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTplId(t.id)}
                      className="card"
                      style={{
                        padding: 14, textAlign: "left",
                        borderColor: tplId === t.id ? "var(--primary)" : "var(--line)",
                        boxShadow: tplId === t.id ? "0 0 0 3px var(--primary-soft)" : "var(--shadow-sm)",
                        background: "var(--bg-elev)",
                        display: "flex", flexDirection: "column", gap: 6,
                      }}
                    >
                      <div className="row gap-2">
                        <Icon name={t.icon} size={16} style={{ color: "var(--primary)" }} />
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>
                          {t.name}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.5 }}>{t.description}</div>
                    </button>
                  ))}
                </div>
                <div className="card" style={{ padding: 16, background: "var(--bg-soft)" }}>
                  <button
                    className="row gap-2"
                    style={{ width: "100%", justifyContent: "space-between", fontSize: 13.5, fontWeight: 500 }}
                    onClick={() => setShowLegal((v) => !v)}
                  >
                    <span className="row gap-2">
                      <Icon name="scale" size={14} style={{ color: "var(--primary)" }} /> 此模板適用之法令依據
                    </span>
                    <Icon name={showLegal ? "chevronUp" : "chevronDown"} size={14} />
                  </button>
                  {showLegal && (
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      {tpl.legal.map((c) => {
                        const m = LEGAL[c];
                        return (
                          <div
                            key={c}
                            style={{
                              fontSize: 12.5, lineHeight: 1.6, padding: "8px 10px",
                              background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: 6,
                            }}
                          >
                            <div style={{ fontWeight: 600, color: "var(--primary)" }}>{m?.title || c}</div>
                            {m && <div style={{ color: "var(--ink-soft)", marginTop: 2 }}>{m.body}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div>
                  <h2 style={{ fontSize: 24 }}>步驟 2 · 填寫資訊</h2>
                  <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 4 }}>
                    右側即時更新，未填欄位顯示為灰色虛線，<b>數字會自動轉為國字大寫</b>。
                  </p>
                </div>
                {prefillBanner && (
                  <div className="card" style={{
                    padding: "12px 14px", background: "var(--amber-50)",
                    border: "1px solid #f0d9a4", color: "#5b3f10",
                    borderRadius: "var(--radius)", fontSize: 13,
                  }}>
                    <Icon name="info" size={13} /> {prefillBanner}
                  </div>
                )}
                {Object.entries(groupedFields).map(([gid, fs]) => (
                  <div key={gid}>
                    <div
                      style={{
                        fontSize: 11.5, fontWeight: 600, letterSpacing: "0.08em",
                        textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 10,
                      }}
                    >
                      {tpl.groups[gid]}
                    </div>
                    <div className="dg-fields-2col">
                      {fs.map((f) => (
                        <div
                          key={f.id}
                          className="field"
                          style={{ gridColumn: f.span === 2 ? "1 / -1" : "auto" }}
                        >
                          <label className="field-label">
                            {f.label}
                            {f.required && <span className="field-required">*</span>}
                          </label>
                          {f.type === "textarea" ? (
                            <textarea
                              className={`textarea ${errors[f.id] ? "error" : ""}`}
                              placeholder={f.placeholder}
                              value={values[f.id] || ""}
                              onChange={(e) => setVal(f.id, e.target.value)}
                              rows={3}
                            />
                          ) : f.type === "select" ? (
                            <select
                              className="select"
                              value={values[f.id] || ""}
                              onChange={(e) => setVal(f.id, e.target.value)}
                            >
                              {f.options?.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className={`input ${errors[f.id] ? "error" : ""}`}
                              type="text"
                              inputMode={f.type === "number" ? "numeric" : undefined}
                              placeholder={f.placeholder}
                              value={values[f.id] || ""}
                              onChange={(e) => setVal(f.id, e.target.value)}
                            />
                          )}
                          {errors[f.id] && (
                            <span className="field-error">
                              <Icon name="alert" size={11} /> {errors[f.id]}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                  風險檢查 · Risk Check
                </div>
                <RiskCheckPanel templateId={tpl.id} values={values} context={tpl.name} />
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div>
                  <h2 style={{ fontSize: 24 }}>步驟 3 · 雙方簽署</h2>
                  <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 4 }}>
                    示範：你可以同時為甲乙雙方簽名。實際情境，乙方會收到簽署連結。
                  </p>
                </div>
                <div className="dg-fields-2col" style={{ gap: 16 }}>
                  <SignaturePad
                    label={`甲方　${values.party_a_name || "請先填姓名"}`}
                    value={sigA}
                    onChange={setSigA}
                  />
                  <SignaturePad
                    label={`乙方　${values.party_b_name || "請先填姓名"}`}
                    value={sigB}
                    onChange={setSigB}
                  />
                </div>
                <div
                  className="card"
                  style={{
                    padding: 14, background: "var(--bg-soft)",
                    display: "flex", gap: 12, fontSize: 13, color: "var(--ink-soft)",
                  }}
                >
                  <Icon
                    name="shieldCheck"
                    size={16}
                    style={{ color: "var(--primary)", marginTop: 1, flexShrink: 0 }}
                  />
                  <div>
                    簽署即代表雙方詳閱並同意所有條款。系統將留存簽署時間戳、IP 位址、簽名圖檔之 SHA-256
                    雜湊值，依電子簽章法 §4、§9，與紙本簽署具同等法律效力。
                  </div>
                </div>
                {submitErr && (
                  <div className="field-error">
                    <Icon name="alert" size={11} /> {submitErr}
                  </div>
                )}
              </div>
            )}

            <div className="dg-newcontract-cta">
              <button
                className="btn btn-soft"
                onClick={() => (step === 1 ? router.push("/") : setStep((s) => s - 1))}
              >
                <Icon name="arrowLeft" size={14} />
                {step === 1 ? "回首頁" : "上一步"}
              </button>
              <div className="row gap-3">
                {step === 2 && Object.keys(errors).length > 0 && (
                  <span className="field-error">
                    <Icon name="alert" size={12} />請完成必填欄位
                  </span>
                )}
                <button
                  className="btn btn-primary btn-lg"
                  onClick={proceed}
                  disabled={(step === 3 && (!sigA || !sigB)) || submitting}
                >
                  {submitting
                    ? "送出中…"
                    : step === 1
                    ? "下一步：填寫資訊"
                    : step === 2
                    ? "下一步：簽署"
                    : "正式簽署"}
                  <Icon name="arrowRight" size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="dg-newcontract-preview">
            <div
              style={{
                position: "sticky", top: 0, zIndex: 5, padding: "12px 24px",
                background: "color-mix(in oklab, var(--bg-soft) 92%, transparent)",
                backdropFilter: "blur(6px)",
                borderBottom: "1px solid var(--line)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <div className="row gap-2" style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                <Icon name="eye" size={13} />即時預覽 · 滾動查看完整合約
              </div>
              <div className="row gap-2">
                <span className="chip chip-zinc" style={{ fontSize: 11 }}>
                  <Icon name="fileText" size={11} />
                  {tpl.clauses(values).length} 條
                </span>
                <span className="chip chip-zinc" style={{ fontSize: 11 }}>
                  <Icon name="scale" size={11} />
                  {[...new Set(tpl.clauses(values).flatMap((c) => c.ref))].length} 法令
                </span>
              </div>
            </div>
            <ContractPreview template={tpl} values={values} sigA={sigA} sigB={sigB} />
          </div>
        </div>
      ) : (
        <CompleteView
          tpl={tpl}
          values={values}
          sigA={sigA}
          sigB={sigB}
          signedA={signedA}
          signedB={signedB}
          contractId={contractId}
          recipientUrl={recipientUrl}
          signingToken={signingToken}
          onHome={() => router.push("/")}
        />
      )}
    </div>
  );
}

function CompleteView({
  tpl,
  values,
  sigA,
  sigB,
  signedA,
  signedB,
  contractId,
  recipientUrl,
  signingToken,
  onHome,
}: {
  tpl: ReturnType<typeof getTemplate>;
  values: Values;
  sigA: string;
  sigB: string;
  signedA: string;
  signedB: string;
  contractId: string | null;
  recipientUrl: string | null;
  signingToken: string | null;
  onHome: () => void;
}) {
  const pdfUrl = contractId && signingToken ? `/api/contracts/${contractId}/pdf?token=${signingToken}` : null;
  const [showAttach, setShowAttach] = useState(false);
  if (!tpl) return null;
  return (
    <div className="container dg-complete-grid" style={{ padding: "40px 32px 80px" }}>
      <aside
        style={{
          position: "sticky", top: 80, alignSelf: "flex-start",
          display: "flex", flexDirection: "column", gap: 18,
        }}
      >
        <div
          style={{
            width: 56, height: 56, borderRadius: 16,
            background: "var(--green-100)", color: "var(--green-700)",
            display: "grid", placeItems: "center",
          }}
        >
          <Icon name="checkCircle" size={26} />
        </div>
        <div>
          <h2 style={{ fontSize: 26 }}>合約已雙方簽署</h2>
          <p style={{ color: "var(--ink-soft)", marginTop: 6 }}>
            編號 #{contractId || "—"} · 已存證並寄送雙方信箱。
          </p>
        </div>
        <div className="card" style={{ padding: 16, fontSize: 12.5, lineHeight: 1.7 }}>
          <div className="row gap-2" style={{ color: "var(--ink-muted)", marginBottom: 6 }}>
            <Icon name="hash" size={12} /> 存證資訊
          </div>
          <div style={{ fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}>
            <div>甲方：{signedA}</div>
            <div style={{ marginTop: 4 }}>乙方：{signedB}</div>
          </div>
        </div>
        {recipientUrl && (
          <div className="card" style={{ padding: 14, fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>收件方簽署連結</div>
            <code style={{ fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>{recipientUrl}</code>
          </div>
        )}
        <a
          className="btn btn-stamp btn-lg"
          href={pdfUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!pdfUrl}
          style={{ opacity: pdfUrl ? 1 : 0.5, pointerEvents: pdfUrl ? "auto" : "none" }}
        >
          <Icon name="download" size={14} /> 下載 PDF
        </a>
        <button
          className="btn btn-ghost"
          onClick={() => recipientUrl && navigator.clipboard.writeText(recipientUrl)}
        >
          <Icon name="copy" size={14} /> 複製分享連結
        </button>
        {contractId && (
          <Link href={`/contracts/${contractId}`} className="btn btn-soft">
            <Icon name="folder" size={14} /> 開啟合約頁（管理 milestone）
          </Link>
        )}
        {contractId && (
          <button className="btn btn-soft" onClick={() => setShowAttach(true)}>
            <Icon name="folder" size={14} /> 指派到案件
          </button>
        )}
        <button className="btn btn-soft" onClick={onHome}>
          <Icon name="home" size={14} /> 回首頁
        </button>
        <LegalDisclaimer compact />
      </aside>
      {showAttach && contractId && (
        <AttachToCaseModal
          contractId={contractId}
          currentCaseId={null}
          onClose={() => setShowAttach(false)}
          onDone={() => setShowAttach(false)}
        />
      )}
      <div
        style={{
          background: "var(--bg-soft)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--line)",
        }}
      >
        <ContractPreview
          template={tpl}
          values={values}
          sigA={sigA}
          sigB={sigB}
          signedA={signedA}
          signedB={signedB}
          scale={0.92}
        />
      </div>
    </div>
  );
}

function hashStub(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(8, "0").slice(0, 8);
}

export default function NewContractPage() {
  return (
    <>
      <TopNav />
      <Suspense fallback={<div style={{ padding: 40 }}>載入中…</div>}>
        <NewInner />
      </Suspense>
    </>
  );
}
