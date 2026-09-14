"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { Stepper } from "@/components/Stepper";
import { Icon } from "@/components/Icon";
import { ContractPreview } from "@/components/ContractPreview";
import { SignaturePad } from "@/components/SignaturePad";
import { RiskCheckPanel } from "@/components/RiskCheckPanel";
import { BillingBanner } from "@/components/BillingBanner";
import { ContractTemplatePicker } from "@/components/ContractTemplatePicker";
import { ContractFormFields, type ContractFieldGroups } from "@/components/ContractFormFields";
import { ContractComplete } from "@/components/ContractComplete";
import { TEMPLATES, getTemplate, type Values } from "@/lib/templates";

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
  const [prefillFailed, setPrefillFailed] = useState(false);
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
  const pendingPrefill = useRef<{ templateId: string; values: Values } | null>(null);
  const activeTemplateId = useRef(tplId);
  const submitInFlight = useRef(false);

  useEffect(() => {
    activeTemplateId.current = tplId;
  }, [tplId]);

  useEffect(() => {
    const prefill = pendingPrefill.current;
    setValues(
      prefill?.templateId === tpl.id
        ? { ...tpl.defaults, ...prefill.values }
        : { ...tpl.defaults },
    );
    if (prefill?.templateId === tpl.id) pendingPrefill.current = null;
    setErrors({});
  }, [tpl, tplId]);

  // Prefill from a milestone (e.g., overdue → 催款通知書)
  useEffect(() => {
    if (!fromMilestone) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/milestones/${fromMilestone}/dunning-prefill`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (cancelled) return;
        const targetTemplate = getTemplate(j.templateId || tplParam) || TEMPLATES[0];
        if (j.values) {
          pendingPrefill.current = { templateId: targetTemplate.id, values: j.values };
        }
        if (targetTemplate.id === activeTemplateId.current) {
          setValues({ ...targetTemplate.defaults, ...(j.values || {}) });
          pendingPrefill.current = null;
          setErrors({});
        } else {
          setTplId(targetTemplate.id);
        }
        setPrefillFailed(false);
        setPrefillBanner("已從逾期項目自動帶入收件人 / 金額 / 原約定到期日。請覆核後送出。");
        setStep(2);
      } catch {
        if (cancelled) return;
        setPrefillFailed(true);
        setPrefillBanner("無法載入逾期項目的預填資料。你仍可手動填寫並繼續建立合約。");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fromMilestone, tplParam]);

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
    const firstError = Object.keys(e)[0];
    if (firstError) {
      requestAnimationFrame(() => document.getElementById(`contract-field-${firstError}`)?.focus());
    }
    return Object.keys(e).length === 0;
  };

  const groupedFields = useMemo(() => {
    const g: ContractFieldGroups = {};
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
      if (submitInFlight.current) return;
      submitInFlight.current = true;
      try {
        await submitToAPI();
      } catch {
        return;
      } finally {
        submitInFlight.current = false;
      }
      const t = new Date().toISOString().replace("T", " ").slice(0, 19);
      setSignedA(`${t} · IP 203.69.x.x · #${hashStub(sigA)}`);
      setSignedB(`${t} · IP 114.32.x.x · #${hashStub(sigB)}`);
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const stepNames = ["選模板", "填資訊", "簽名", "完成"];

  return (
    <main className="page dg-newcontract-page" id="main-content">
      {step < 4 && (
        <header className="dg-newcontract-progress">
          <div className="dg-page-shell dg-newcontract-progress__inner">
            <h1 className="dg-page-title">建立新合約</h1>
            <Stepper steps={stepNames} current={step - 1} />
            <div className="dg-newcontract-draft-status" role="status">
              <Icon name="save" size={13} /> 草稿僅保留於目前頁面
            </div>
          </div>
        </header>
      )}

      {step < 4 ? (
        <div className="dg-page-shell dg-newcontract-grid">
          <div className="dg-newcontract-form">
            {step === 1 && (
              <div className="dg-stack">
                {prefillBanner && prefillFailed && (
                  <div className="dg-notice dg-notice--warning dg-newcontract-prefill" role="status">
                    <Icon name="info" size={13} />{prefillBanner}
                  </div>
                )}
                <BillingBanner />
                <div className="dg-newcontract-step-heading">
                  <h2 className="dg-section-title">步驟 1 · 選擇合約類型</h2>
                  <p className="dg-text-secondary">
                    不同類型適用不同民法章節，選錯不影響，後面隨時可換。
                  </p>
                </div>
                <ContractTemplatePicker
                  templates={TEMPLATES}
                  selectedTemplate={tpl}
                  showLegal={showLegal}
                  onSelect={setTplId}
                  onToggleLegal={() => setShowLegal((visible) => !visible)}
                />
              </div>
            )}

            {step === 2 && (
              <div className="dg-stack">
                <div className="dg-newcontract-step-heading">
                  <h2 className="dg-section-title">步驟 2 · 填寫資訊</h2>
                  <p className="dg-text-secondary">
                    右側即時更新，未填欄位顯示為灰色虛線，<b>數字會自動轉為國字大寫</b>。
                  </p>
                </div>
                {prefillBanner && (
                  <div
                    className={`dg-notice ${prefillFailed ? "dg-notice--warning" : "dg-notice--info"} dg-newcontract-prefill`}
                    role="status"
                  >
                    <Icon name="info" size={13} /> {prefillBanner}
                  </div>
                )}
                <ContractFormFields
                  template={tpl}
                  groups={groupedFields}
                  values={values}
                  errors={errors}
                  onChange={setVal}
                />
              </div>
            )}

            {step === 2 && (
              <section className="dg-newcontract-risk" aria-labelledby="contract-risk-heading">
                <h2 className="dg-eyebrow" id="contract-risk-heading">
                  風險檢查 · Risk Check
                </h2>
                <RiskCheckPanel templateId={tpl.id} values={values} context={tpl.name} headingLevel={3} />
              </section>
            )}

            {step === 3 && (
              <div className="dg-stack">
                <div className="dg-newcontract-step-heading">
                  <h2 className="dg-section-title">步驟 3 · 簽署與送出</h2>
                  <p className="dg-text-secondary">
                    示範：你可以同時為甲乙雙方簽名。實際情境，乙方會收到簽署連結。
                  </p>
                </div>
                <fieldset className="dg-newcontract-fieldset">
                  <legend className="dg-visually-hidden">甲乙雙方簽名</legend>
                  <div className="dg-fields-2col dg-newcontract-signatures">
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
                </fieldset>
                <p className="dg-newcontract-signature-status" role="status" aria-live="polite">
                  已完成 {[sigA, sigB].filter(Boolean).length} / 2 份畫面簽名
                </p>
                <div className="dg-notice dg-notice--info dg-newcontract-legal-note">
                  <Icon name="shieldCheck" size={16} />
                  <p>
                    按下正式簽署後，僅甲方簽名會隨既有建立請求送出；乙方仍須透過收件方連結完成簽署。
                    本頁乙方簽名、時間、遮罩 IP 與短雜湊僅供示範預覽，不代表伺服器已完成雙簽或法律存證。
                  </p>
                </div>
                {submitErr && (
                  <div className="dg-notice dg-notice--error dg-newcontract-submit-error" id="contract-submit-error" role="alert">
                    <Icon name="alert" size={12} />{submitErr}
                  </div>
                )}
              </div>
            )}

            <div className="dg-newcontract-cta" role="group" aria-label="建立合約步驟操作">
              <button
                className="btn btn-soft"
                onClick={() => (step === 1 ? router.push("/") : setStep((s) => s - 1))}
              >
                <Icon name="arrowLeft" size={14} />
                {step === 1 ? "回首頁" : "上一步"}
              </button>
              <div className="dg-newcontract-cta__primary">
                {step === 2 && Object.keys(errors).length > 0 && (
                  <span className="field-error">
                    <Icon name="alert" size={12} />請完成必填欄位
                  </span>
                )}
                <button
                  className="btn btn-primary btn-lg"
                  onClick={proceed}
                  disabled={(step === 3 && (!sigA || !sigB)) || submitting}
                  aria-busy={submitting || undefined}
                  aria-describedby={step === 3 && submitErr ? "contract-submit-error" : undefined}
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
            <div className="dg-newcontract-preview__toolbar">
              <div className="dg-newcontract-preview__label">
                <Icon name="eye" size={13} />即時預覽 · 滾動查看完整合約
              </div>
              <div className="dg-newcontract-preview__meta">
                <span className="chip chip-zinc">
                  <Icon name="fileText" size={11} />
                  {tpl.clauses(values).length} 條
                </span>
                <span className="chip chip-zinc">
                  <Icon name="scale" size={11} />
                  {[...new Set(tpl.clauses(values).flatMap((c) => c.ref))].length} 法令
                </span>
              </div>
            </div>
            <ContractPreview template={tpl} values={values} sigA={sigA} sigB={sigB} />
          </div>
        </div>
      ) : (
        <ContractComplete
          template={tpl}
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
    </main>
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
