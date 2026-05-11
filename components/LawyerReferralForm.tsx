"use client";
import { useState } from "react";
import { Icon } from "./Icon";

const CITIES = ["台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市", "新竹", "其他"];
const TOPICS = ["接案 / 承攬", "保密 / NDA", "勞動 / 競業", "借貸 / 票據", "租賃", "買賣 / 消保", "智慧財產", "其他"];
const BUDGETS = ["NT$ 5,000 內", "5,000–20,000", "20,000–50,000", "50,000+", "視情況"];

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

  async function submit() {
    setErr(null);
    if (!agree) return setErr("請勾選同意條款");
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
      <div className="card" style={{
        padding: 22, background: "#e8f5ed", border: "1px solid #bfe1c8", color: "#1f5a35",
        borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div className="row gap-2"><Icon name="checkCircle" size={16} /><b>已收到您的轉介需求</b></div>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          我們會在 1–2 個工作日內以 Email <b>{email}</b> 媒合 1–2 位合作律師。
          律師費由您與律師直接議定，DocGen TW 不抽取轉介費。
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{
      padding: 22, background: "var(--bg-elev)", border: "1px solid var(--line)",
      borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: 14,
    }}>
      <div className="row gap-2" style={{ alignItems: "center" }}>
        <Icon name="scale" size={16} style={{ color: "var(--primary)" }} />
        <b style={{ fontSize: 15 }}>申請律師轉介</b>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.6 }}>
        DocGen TW 不直接提供法律意見，但可媒合熟悉相應領域之合作律師。
        我們不抽取轉介費，律師費由您與律師議定。
      </div>

      <div className="dg-fields-2col" style={{ gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>姓名 / 公司 *</label>
          <input className="input" style={{ marginTop: 4 }} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>Email *</label>
          <input className="input" style={{ marginTop: 4 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>電話</label>
          <input className="input" style={{ marginTop: 4 }} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>城市</label>
          <select className="input" style={{ marginTop: 4 }} value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">請選擇</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>主題</label>
          <select className="input" style={{ marginTop: 4 }} value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">請選擇</option>
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>預算</label>
          <select className="input" style={{ marginTop: 4 }} value={budget} onChange={(e) => setBudget(e.target.value)}>
            <option value="">請選擇</option>
            {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>案情描述 *</label>
        <textarea className="input" rows={5} style={{ marginTop: 4, resize: "vertical" }}
          placeholder="簡述：發生什麼事、目前進度、希望律師處理什麼。請勿提供身分證號或其他敏感個資。"
          value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <label className="row gap-2" style={{ fontSize: 12.5, alignItems: "flex-start" }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 3 }} />
        <span style={{ color: "var(--ink-muted)", lineHeight: 1.6 }}>
          我了解 DocGen TW 為文件自動化平台，非執業律師、不取代法律意見；
          且同意將上述資訊轉知合作律師以提供諮詢。資料保留 1 年。
        </span>
      </label>

      {err && <div className="field-error"><Icon name="alert" size={12} />{err}</div>}

      <button className="btn btn-primary" onClick={submit} disabled={busy || !agree}>
        {busy ? "送出中…" : "送出轉介需求"}
      </button>
    </div>
  );
}
