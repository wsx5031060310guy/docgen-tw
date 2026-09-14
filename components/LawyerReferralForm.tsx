"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "./Icon";

const CITIES = ["台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市", "新竹", "其他"];
const TOPICS = ["接案 / 承攬", "保密 / NDA", "勞動 / 競業", "借貸 / 票據", "租賃", "買賣 / 消保", "智慧財產", "其他"];
const BUDGETS = ["NT$ 5,000 內", "5,000–20,000", "20,000–50,000", "50,000+", "視情況"];

type RequiredField = "name" | "email" | "description";

export function LawyerReferralForm({ contractId, defaultTopic }: { contractId?: string; defaultTopic?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [topic, setTopic] = useState(defaultTopic ?? "");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredField, string>>>({});

  function clearFieldError(field: RequiredField) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErr(null);
    if (!agree) return setErr("請勾選同意條款");

    const nextErrors: Partial<Record<RequiredField, string>> = {};
    if (!name.trim()) nextErrors.name = "請填寫姓名 / 公司";
    if (!email.trim()) nextErrors.email = "請填寫 Email";
    if (!description.trim()) nextErrors.description = "請填寫案情描述";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setErr("請完成所有必填欄位");
      return;
    }

    setBusy(true);
    try {
      const r = await fetch("/api/referrals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, phone, city, topic, budget, description, contractId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setDone(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="card dg-referral-form dg-referral-success" role="status" aria-live="polite" aria-labelledby="referral-success-title">
        <h3 id="referral-success-title" className="dg-subsection-title dg-referral-form-title"><Icon name="checkCircle" size={16} />已收到您的轉介需求</h3>
        <p className="dg-body">
          我們會在 1–2 個工作日內以 Email <strong>{email}</strong> 媒合 1–2 位合作律師。
          律師費由您與律師直接議定，DocGen TW 不抽取轉介費。
        </p>
      </section>
    );
  }

  const customTopic = topic && !TOPICS.includes(topic) ? topic : null;

  return (
    <form className="card dg-referral-form" onSubmit={submit} noValidate aria-busy={busy || undefined} aria-describedby={`referral-form-description${err ? " referral-form-error" : ""}`}>
      <h3 className="dg-subsection-title dg-referral-form-title"><Icon name="scale" size={16} />轉介需求資料</h3>
      <p id="referral-form-description" className="dg-text-secondary">
        DocGen TW 不直接提供法律意見，但可媒合熟悉相應領域之合作律師。
        我們不抽取轉介費，律師費由您與律師議定。
      </p>

      <fieldset className="dg-referral-fieldset">
        <legend className="dg-visually-hidden">聯絡方式與案件分類</legend>
        <div className="dg-form-grid dg-referral-grid">
          <div className="field">
            <label htmlFor="referral-name" className="field-label">姓名 / 公司 <span className="field-required" aria-hidden="true">*</span></label>
            <input id="referral-name" className="input" value={name} onChange={(event) => { setName(event.target.value); clearFieldError("name"); }} required aria-required="true" aria-invalid={Boolean(fieldErrors.name) || undefined} aria-describedby={fieldErrors.name ? "referral-name-error" : undefined} />
            {fieldErrors.name && <p id="referral-name-error" className="field-error"><Icon name="alert" size={12} />{fieldErrors.name}</p>}
          </div>
          <div className="field">
            <label htmlFor="referral-email" className="field-label">Email <span className="field-required" aria-hidden="true">*</span></label>
            <input id="referral-email" className="input" type="email" value={email} onChange={(event) => { setEmail(event.target.value); clearFieldError("email"); }} required aria-required="true" aria-invalid={Boolean(fieldErrors.email) || undefined} aria-describedby={fieldErrors.email ? "referral-email-error" : undefined} />
            {fieldErrors.email && <p id="referral-email-error" className="field-error"><Icon name="alert" size={12} />{fieldErrors.email}</p>}
          </div>
          <div className="field">
            <label htmlFor="referral-phone" className="field-label">電話</label>
            <input id="referral-phone" className="input" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="referral-city" className="field-label">城市</label>
            <select id="referral-city" className="select" value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">請選擇</option>
              {CITIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="referral-topic" className="field-label">主題</label>
            <select id="referral-topic" className="select" value={topic} onChange={(event) => setTopic(event.target.value)}>
              <option value="">請選擇</option>
              {customTopic && <option value={customTopic}>{customTopic}</option>}
              {TOPICS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="referral-budget" className="field-label">預算</label>
            <select id="referral-budget" className="select" value={budget} onChange={(event) => setBudget(event.target.value)}>
              <option value="">請選擇</option>
              {BUDGETS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="referral-description" className="field-label">案情描述 <span className="field-required" aria-hidden="true">*</span></label>
        <textarea
          id="referral-description"
          className="textarea dg-referral-description"
          rows={5}
          placeholder="簡述：發生什麼事、目前進度、希望律師處理什麼。請勿提供身分證號或其他敏感個資。"
          value={description}
          onChange={(event) => { setDescription(event.target.value); clearFieldError("description"); }}
          required
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.description) || undefined}
          aria-describedby={`referral-description-help${fieldErrors.description ? " referral-description-error" : ""}`}
        />
        <p id="referral-description-help" className="field-help">請勿提供身分證號、完整銀行帳號或其他非必要敏感個資。</p>
        {fieldErrors.description && <p id="referral-description-error" className="field-error"><Icon name="alert" size={12} />{fieldErrors.description}</p>}
      </div>

      <fieldset className="dg-referral-fieldset">
        <legend className="dg-visually-hidden">資料分享同意</legend>
        <label className="dg-checkbox-row dg-referral-consent" htmlFor="referral-agree">
          <input id="referral-agree" type="checkbox" checked={agree} onChange={(event) => { setAgree(event.target.checked); if (event.target.checked && err === "請勾選同意條款") setErr(null); }} required aria-required="true" aria-describedby="referral-consent-description" />
          <span id="referral-consent-description">
            我了解 DocGen TW 為文件自動化平台，非執業律師、不取代法律意見；
            且同意將上述資訊轉知合作律師以提供諮詢。資料保留 1 年。
          </span>
        </label>
      </fieldset>

      {err && <div id="referral-form-error" className="dg-notice dg-notice--error dg-referral-error" role="alert" aria-live="assertive"><Icon name="alert" size={14} /><span>{err}</span></div>}

      <button className="btn btn-primary dg-referral-submit" type="submit" disabled={busy} aria-busy={busy || undefined}>
        {busy && <Icon name="loader" size={14} className="spin" />}{busy ? "送出中…" : "送出轉介需求"}
      </button>
    </form>
  );
}
