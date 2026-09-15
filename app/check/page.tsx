"use client";

import { useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { LawyerReferralCTA } from "@/components/LawyerReferralCTA";
import { RiskFindingCard, RISK_LEVEL_CLASS, RISK_LEVEL_LABEL } from "@/components/RiskFindingCard";
import { UIState } from "@/components/UIState";
import type { RiskFinding, RiskLevel } from "@/lib/risk-rules";

type LlmFinding = {
  source: "llm";
  level: RiskLevel;
  title: string;
  detail: string;
  suggestion: string;
  legalBasis: string[];
  referLawyer: boolean;
  id: string;
};

type Result = {
  summary: { level: RiskLevel; reds: number; yellows: number; needsLawyer: boolean; oneliner: string };
  findings: RiskFinding[];
  llm?: { findings: LlmFinding[]; reason?: string };
  chars: number;
  shareId?: string;
  templateSuggestion?: { templateId: string; name: string; score: number; reasonMatches: string[] } | null;
};

const SAMPLE = `委任方 王小明 委託受任方 陳設計 進行 logo 設計，報酬新台幣 三十萬 元整。
受任方應於 2026/06/30 前完成交付。
本合約終止後，受任方應永久保密所有合作資訊。
甲方得隨時終止本合約，無須通知。
受任方逾期交付，每日按報酬 1% 計付違約金。
本合約以美國加州法院為管轄法院。`;

export default function CheckPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [useLlm, setUseLlm] = useState(true);
  const [doShare, setDoShare] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">("idle");

  async function run() {
    setErr(null);
    setCopyState("idle");
    if (!text.trim()) return setErr("請貼上合約文字");
    setBusy(true);
    try {
      const r = await fetch("/api/check-text", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, llm: useLlm, share: doShare }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setResult(j);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copyShareLink() {
    if (!result?.shareId) return;
    const url = `${window.location.origin}/shared/check/${result.shareId}`;
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(url);
      setCopyState("success");
    } catch {
      setCopyState("error");
    }
  }

  const summaryStyle = result ? RISK_LEVEL_CLASS[result.summary.level] : null;
  const shareUrl = result?.shareId && typeof window !== "undefined"
    ? `${window.location.origin}/shared/check/${result.shareId}`
    : result?.shareId ? `/shared/check/${result.shareId}` : "";

  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-check-page">
        <header className="dg-page-shell dg-check-shell dg-check-hero">
          <div className="dg-eyebrow dg-check-eyebrow"><Icon name="shieldCheck" size={13} /> 合約風險快檢</div>
          <h1 className="dg-page-title dg-check-title">
            把現有合約丟進來，<br />30 秒看出<span className="dg-check-title-accent"> 紅旗</span>條款。
          </h1>
          <p className="dg-body dg-check-lead">
            DocGen TW 規則式檢查：年息超過民法 §205 上限 / 違約金過高 / 永久保密 /
            單方終止 / 全面拋棄請求權 / 外國管轄 / 缺管轄條款 / 缺違約金 / 缺簽署方式…
            等 15 條台灣法律常見高風險寫法。<strong>免費、免註冊、不儲存內容</strong>。
          </p>
        </header>

        <section className="dg-page-shell dg-check-shell dg-check-workspace" aria-label="合約風險分析工具">
          <div className="dg-check-grid">
            <div className="card dg-card-compact dg-check-form-card">
              <div className="dg-check-field-heading">
                <label className="field-label dg-check-label" htmlFor="contract-text">貼上合約文字</label>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setText(SAMPLE)}><Icon name="copy" size={11} />試試範例</button>
              </div>
              <textarea
                id="contract-text"
                className="textarea dg-check-textarea"
                rows={14}
                placeholder="把整份合約 / 條款文字直接貼進來，建議至少 200 字以獲得有意義的檢查結果"
                value={text}
                onChange={(event) => setText(event.target.value)}
                aria-describedby={`contract-text-help${err ? " contract-text-error" : ""}`}
                aria-invalid={Boolean(err) || undefined}
              />
              <div id="contract-text-help" className="dg-check-text-meta">
                <span>{text.length.toLocaleString()} / 50,000 字</span>
                {(text || result) && (
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setText(""); setResult(null); setErr(null); setCopyState("idle"); }}>清除</button>
                )}
              </div>
              <fieldset className="dg-check-options">
                <legend className="dg-visually-hidden">分析選項</legend>
                <label className="dg-checkbox-row" htmlFor="check-use-llm">
                  <input id="check-use-llm" type="checkbox" checked={useLlm} onChange={(event) => setUseLlm(event.target.checked)} />
                  <span>AI 補充檢查（Gemini 2.5）</span>
                </label>
                <label className="dg-checkbox-row" htmlFor="check-create-share">
                  <input id="check-create-share" type="checkbox" checked={doShare} onChange={(event) => setDoShare(event.target.checked)} />
                  <span>產生分享連結（30 天）</span>
                </label>
              </fieldset>
              {err && <div id="contract-text-error" className="field-error dg-check-error" role="alert"><Icon name="alert" size={12} />{err}</div>}
              <button className="btn btn-primary btn-lg dg-check-submit" type="button" onClick={run} disabled={busy || !text.trim()} aria-busy={busy || undefined}>
                {busy ? "分析中…" : "開始風險檢查"}
                <Icon name={busy ? "loader" : "arrowRight"} size={14} className={busy ? "spin" : undefined} />
              </button>
            </div>

            <div className="dg-check-results" aria-busy={busy || undefined}>
              <h2 className="dg-visually-hidden">檢查結果</h2>
              {!result && !busy && <UIState status="empty" title="等待檢查" description="檢查結果將顯示於此。所有規則皆引用中華民國現行法令，並提供具體修改建議。" />}
              {!result && busy && <UIState status="loading" title="正在分析合約" description="長篇合約可能需要稍候，請勿關閉此頁。" />}
              {result && summaryStyle && (
                <>
                  {busy && <div className="dg-notice dg-notice--info dg-risk-status" role="status" aria-live="polite"><Icon name="loader" size={14} className="spin" /><span>重新分析中，目前先顯示上次結果。</span></div>}
                  <div className={`dg-notice dg-notice--${summaryStyle.notice} dg-risk-summary`}>
                    <div className="dg-risk-summary__header">
                      <Icon name={summaryStyle.icon} size={16} />
                      <strong className="dg-risk-summary__title">{RISK_LEVEL_LABEL[result.summary.level]}</strong>
                      <span className="dg-risk-summary__counts">紅 {result.summary.reds} · 黃 {result.summary.yellows}</span>
                    </div>
                    <p className="dg-risk-summary__oneliner">{result.summary.oneliner}</p>
                  </div>
                  {result.findings.length > 0 ? (
                    <div className="dg-risk-findings">{result.findings.map((finding) => <RiskFindingCard key={finding.id} finding={finding} />)}</div>
                  ) : (
                    <div className="dg-notice dg-notice--success dg-risk-status" role="status"><Icon name="checkCircle" size={14} /><span>未偵測到規則式紅旗。仍建議重要交易由律師審閱。</span></div>
                  )}
                  {result.llm && result.llm.findings.length > 0 && (
                    <section className="dg-stack" aria-labelledby="ai-findings-title">
                      <h2 id="ai-findings-title" className="dg-eyebrow dg-check-ai-heading"><Icon name="sparkles" size={12} />AI 補充發現</h2>
                      <div className="dg-risk-findings">{result.llm.findings.map((finding) => <RiskFindingCard key={finding.id} finding={finding} source="ai" />)}</div>
                    </section>
                  )}
                  {result.llm?.reason && result.llm.findings.length === 0 && (
                    <div className="dg-notice dg-notice--warning dg-risk-status" role="status"><Icon name="alert" size={14} /><span>AI 補充檢查暫不可用：{result.llm.reason}</span></div>
                  )}
                  {result.shareId && (
                    <section className="card dg-card-compact dg-check-share" aria-labelledby="share-result-title">
                      <h2 id="share-result-title" className="dg-subsection-title dg-check-card-heading"><Icon name="copy" size={12} />分享連結（30 天有效）</h2>
                      <code className="dg-check-share-url">{shareUrl}</code>
                      <button className="btn btn-soft btn-sm" type="button" onClick={copyShareLink}><Icon name="copy" size={11} />複製連結</button>
                      <p className={`dg-helper dg-check-copy-feedback${copyState === "error" ? " dg-check-copy-feedback--error" : ""}`} role={copyState === "error" ? "alert" : "status"} aria-live="polite">
                        {copyState === "success" ? "已複製分享連結。" : copyState === "error" ? "無法自動複製，請手動選取上方連結。" : ""}
                      </p>
                    </section>
                  )}
                  {result.summary.needsLawyer && <LawyerReferralCTA variant="card" context="貼上合約風險檢查（含紅燈）" />}
                  {result.templateSuggestion && (
                    <section className="dg-notice dg-notice--info dg-check-suggestion" aria-labelledby="template-suggestion-title">
                      <h2 id="template-suggestion-title" className="dg-subsection-title dg-check-card-heading"><Icon name="sparkles" size={14} />建議改用合規範本</h2>
                      <p>本合約內容最接近 <strong>{result.templateSuggestion.name}</strong>。直接用 DocGen 內建範本重新產出可一次解掉多數紅旗（IP 歸屬、違約金上限、管轄條款都會合規）。</p>
                      <Link href={`/contracts/new?tpl=${result.templateSuggestion.templateId}`} className="btn btn-primary btn-sm"><Icon name="fileText" size={11} />用「{result.templateSuggestion.name}」範本重寫</Link>
                    </section>
                  )}
                  <section className="card dg-card-compact dg-check-next" aria-labelledby="check-next-title">
                    <h2 id="check-next-title" className="dg-subsection-title">下一步</h2>
                    <ul>
                      <li>修改上方條款後重新分析</li>
                      <li>或直接用 DocGen TW 內建範本重新產出（避免常見踩雷）：<Link href="/contracts/new" className="dg-link">建立合約</Link></li>
                      <li>複雜案件：<Link href="/disclaimer#referral" className="dg-link">申請律師轉介</Link></li>
                    </ul>
                  </section>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="dg-page-shell dg-check-shell dg-section" aria-labelledby="check-rules-title">
          <h2 id="check-rules-title" className="dg-section-title dg-check-section-title">本工具會檢查哪些常見地雷</h2>
          <div className="dg-check-rules">
            {[
              { t: "年利率超過民法 §205 上限 16%", d: "民間借貸常踩雷；超過部分無請求權。" },
              { t: "違約金 > 0.5% / 日（年化 180%）", d: "法院依 §252 酌減，徒勞無功。" },
              { t: "保密期間永久 / 無限期", d: "違反比例原則部分無效。" },
              { t: "甲方得隨時終止", d: "可能屬定型化契約顯失公平。" },
              { t: "全面拋棄請求權 / 追訴權", d: "違反公序良俗或顯失公平條款無效。" },
              { t: "外國法院管轄", d: "跨境執行成本極高，對台灣方不利。" },
              { t: "離職後競業禁止無代償", d: "違反勞基法 §9-1。" },
              { t: "勞動契約低於基本工資 / 工時逾 8h", d: "違反勞基法強制規定。" },
              { t: "未約定管轄法院", d: "預設依被告住所地，被告佔便宜。" },
              { t: "缺違約 / 賠償條款", d: "民法一般原則舉證較難。" },
            ].map((rule) => (
              <article key={rule.t} className="card dg-card-compact dg-check-rule">
                <h3 className="dg-subsection-title">{rule.t}</h3><p className="dg-helper">{rule.d}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="dg-page-shell dg-check-shell dg-check-disclaimer"><LegalDisclaimer /></section>
        <Footer />
      </main>
    </>
  );
}
