"use client";
import { useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { LawyerReferralCTA } from "@/components/LawyerReferralCTA";
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
};

const LEVEL_STYLE: Record<RiskLevel, { bg: string; border: string; ink: string; chip: string }> = {
  red: { bg: "#fde9e9", border: "#f1b5b5", ink: "#7a1f1f", chip: "#c4322a" },
  yellow: { bg: "var(--amber-50)", border: "#f0d9a4", ink: "#7a5a2a", chip: "var(--amber-600)" },
  "green-info": { bg: "#e8f5ed", border: "#bfe1c8", ink: "#1f5a35", chip: "#2e8b57" },
};
const LEVEL_LABEL: Record<RiskLevel, string> = { red: "紅燈", yellow: "黃燈", "green-info": "綠燈" };

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

  async function run() {
    setErr(null);
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

  function copyShareLink() {
    if (!result?.shareId) return;
    const url = `${window.location.origin}/shared/check/${result.shareId}`;
    navigator.clipboard.writeText(url).catch(() => undefined);
  }

  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "32px 32px 16px", maxWidth: 960 }}>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            <Icon name="shieldCheck" size={13} /> 合約風險快檢
          </div>
          <h1 style={{ fontSize: 44, lineHeight: 1.1 }}>
            把現有合約丟進來，
            <br />
            30 秒看出
            <span style={{ fontFamily: "var(--font-italic)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>
              {" "}紅旗
            </span>
            條款。
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--ink-soft)", marginTop: 14 }}>
            DocGen TW 規則式檢查：年息超過民法 §205 上限 / 違約金過高 / 永久保密 /
            單方終止 / 全面拋棄請求權 / 外國管轄 / 缺管轄條款 / 缺違約金 / 缺簽署方式…
            等 15 條台灣法律常見高風險寫法。<b>免費、免註冊、不儲存內容</b>。
          </p>
        </section>

        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 960 }}>
          <div className="dg-fields-2col" style={{ gap: 16, alignItems: "flex-start" }}>
            <div className="card" style={{
              padding: 16, background: "var(--bg-elev)", border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
            }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>貼上合約文字</label>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setText(SAMPLE)}>
                  <Icon name="copy" size={11} />試試範例
                </button>
              </div>
              <textarea
                className="input"
                rows={14}
                style={{ resize: "vertical", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7 }}
                placeholder="把整份合約 / 條款文字直接貼進來，建議至少 200 字以獲得有意義的檢查結果"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="row" style={{ marginTop: 10, justifyContent: "space-between", fontSize: 12, color: "var(--ink-muted)" }}>
                <span>{text.length.toLocaleString()} / 50,000 字</span>
                {(text || result) && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setText(""); setResult(null); }}>
                    清除
                  </button>
                )}
              </div>
              <div className="row gap-3" style={{ marginTop: 10, flexWrap: "wrap", fontSize: 13 }}>
                <label className="row gap-2" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={useLlm} onChange={(e) => setUseLlm(e.target.checked)} />
                  <span>AI 補充檢查（Gemini 2.5）</span>
                </label>
                <label className="row gap-2" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={doShare} onChange={(e) => setDoShare(e.target.checked)} />
                  <span>產生分享連結（30 天）</span>
                </label>
              </div>
              {err && <div className="field-error" style={{ marginTop: 8 }}><Icon name="alert" size={12} />{err}</div>}
              <button
                className="btn btn-primary btn-lg"
                style={{ marginTop: 14, width: "100%" }}
                onClick={run}
                disabled={busy || !text.trim()}
              >
                {busy ? "分析中…" : "開始風險檢查"}
                <Icon name="arrowRight" size={14} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {!result && !busy && (
                <div className="card" style={{ padding: 20, color: "var(--ink-muted)", fontSize: 14, lineHeight: 1.7 }}>
                  <Icon name="info" size={14} /> 檢查結果將顯示於此。所有規則皆引用中華民國現行法令，並提供具體修改建議。
                </div>
              )}
              {result && (
                <>
                  <div className="card" style={{
                    padding: 18, background: LEVEL_STYLE[result.summary.level].bg,
                    border: `1px solid ${LEVEL_STYLE[result.summary.level].border}`,
                    color: LEVEL_STYLE[result.summary.level].ink,
                    borderRadius: "var(--radius)",
                  }}>
                    <div className="row gap-2" style={{ alignItems: "center" }}>
                      <Icon
                        name={result.summary.level === "red" ? "alertOctagon" : result.summary.level === "yellow" ? "alert" : "checkCircle"}
                        size={16}
                        style={{ color: LEVEL_STYLE[result.summary.level].chip }}
                      />
                      <b style={{ fontSize: 15 }}>{LEVEL_LABEL[result.summary.level]}</b>
                      <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.85 }}>
                        紅 {result.summary.reds} · 黃 {result.summary.yellows}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>{result.summary.oneliner}</div>
                  </div>
                  {result.findings.map((f) => {
                    const fs = LEVEL_STYLE[f.level];
                    return (
                      <div key={f.id} className="card" style={{
                        padding: 14, background: "var(--bg-elev)",
                        border: "1px solid var(--line)", borderRadius: "var(--radius)",
                      }}>
                        <div className="row gap-2" style={{ alignItems: "center", marginBottom: 6 }}>
                          <span style={{
                            display: "inline-flex", padding: "2px 8px", borderRadius: 999,
                            background: fs.bg, color: fs.ink, border: `1px solid ${fs.border}`,
                            fontSize: 11, fontWeight: 600,
                          }}>
                            {LEVEL_LABEL[f.level]}
                          </span>
                          <b style={{ fontSize: 14 }}>{f.title}</b>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: 6 }}>{f.detail}</div>
                        <div style={{ fontSize: 12.5, color: "var(--ink)" }}><b>建議：</b>{f.suggestion}</div>
                        {f.legalBasis.length > 0 && (
                          <div className="row gap-2" style={{ marginTop: 8, flexWrap: "wrap" }}>
                            {f.legalBasis.map((b) => (
                              <span key={b} className="chip chip-mono" style={{ fontSize: 11, padding: "2px 8px" }}>{b}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {result.llm && result.llm.findings.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div className="row gap-2" style={{ marginTop: 4, fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        <Icon name="sparkles" size={12} />AI 補充發現
                      </div>
                      {result.llm.findings.map((f) => {
                        const fs = LEVEL_STYLE[f.level];
                        return (
                          <div key={f.id} className="card" style={{
                            padding: 14, background: "var(--bg-elev)",
                            border: "1px dashed var(--line)", borderRadius: "var(--radius)",
                          }}>
                            <div className="row gap-2" style={{ alignItems: "center", marginBottom: 6 }}>
                              <span style={{
                                display: "inline-flex", padding: "2px 8px", borderRadius: 999,
                                background: fs.bg, color: fs.ink, border: `1px solid ${fs.border}`,
                                fontSize: 11, fontWeight: 600,
                              }}>
                                {LEVEL_LABEL[f.level]} · AI
                              </span>
                              <b style={{ fontSize: 14 }}>{f.title}</b>
                            </div>
                            <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: 6 }}>{f.detail}</div>
                            {f.suggestion && <div style={{ fontSize: 12.5 }}><b>建議：</b>{f.suggestion}</div>}
                            {f.legalBasis.length > 0 && (
                              <div className="row gap-2" style={{ marginTop: 8, flexWrap: "wrap" }}>
                                {f.legalBasis.map((b) => (
                                  <span key={b} className="chip chip-mono" style={{ fontSize: 11, padding: "2px 8px" }}>{b}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {result.llm && result.llm.reason && result.llm.findings.length === 0 && (
                    <div className="card" style={{ padding: 12, fontSize: 12, color: "var(--ink-muted)" }}>
                      AI 補充檢查暫不可用：{result.llm.reason}
                    </div>
                  )}
                  {result.shareId && (
                    <div className="card" style={{
                      padding: 14, background: "var(--bg-soft)",
                      border: "1px solid var(--line)", borderRadius: "var(--radius)",
                      display: "flex", flexDirection: "column", gap: 8,
                    }}>
                      <div className="row gap-2"><Icon name="copy" size={12} /><b style={{ fontSize: 13 }}>分享連結（30 天有效）</b></div>
                      <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, wordBreak: "break-all" }}>
                        {typeof window !== "undefined" ? window.location.origin : ""}/shared/check/{result.shareId}
                      </code>
                      <button className="btn btn-soft btn-sm" onClick={copyShareLink} style={{ alignSelf: "flex-start" }}>
                        <Icon name="copy" size={11} />複製連結
                      </button>
                    </div>
                  )}
                  {result.summary.needsLawyer && (
                    <LawyerReferralCTA variant="card" context="貼上合約風險檢查（含紅燈）" />
                  )}
                  <div className="card" style={{
                    padding: 14, background: "var(--bg-soft)",
                    border: "1px solid var(--line)", borderRadius: "var(--radius)",
                    fontSize: 13, lineHeight: 1.6,
                  }}>
                    <b>下一步</b>
                    <ul style={{ paddingLeft: 18, marginTop: 6 }}>
                      <li>修改上方條款後重新分析</li>
                      <li>或直接用 DocGen TW 內建範本重新產出（避免常見踩雷）：<Link href="/contracts/new" style={{ textDecoration: "underline" }}>建立合約</Link></li>
                      <li>複雜案件：<Link href="/disclaimer#referral" style={{ textDecoration: "underline" }}>申請律師轉介</Link></li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 960 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>本工具會檢查哪些常見地雷</h2>
          <div className="dg-fields-2col" style={{ gap: 12 }}>
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
            ].map((r) => (
              <div key={r.t} className="card" style={{
                padding: 14, background: "var(--bg-elev)",
                border: "1px solid var(--line)", borderRadius: "var(--radius)",
              }}>
                <b style={{ fontSize: 14 }}>{r.t}</b>
                <div style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 4 }}>{r.d}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="container" style={{ padding: "12px 32px 64px", maxWidth: 960 }}>
          <LegalDisclaimer />
        </section>

        <Footer />
      </main>
    </>
  );
}
