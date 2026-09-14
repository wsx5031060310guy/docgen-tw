"use client";
import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { UIState } from "@/components/UIState";
import { diffValues, inlineDiff } from "@/lib/diff";
import { getTemplate } from "@/lib/templates";

interface VersionRow {
  id: string;
  version: number;
  values: Record<string, string>;
  note: string | null;
  createdAt: string;
}

interface Data {
  versions: VersionRow[];
  current: {
    values: Record<string, string>;
    signingStatus: string;
    updatedAt: string;
  } | null;
}

const SIGNING_STATUS_LABEL: Record<string, string> = {
  UNSIGNED: "未簽",
  SENDER_SIGNED: "僅甲方簽",
  AWAITING_RECIPIENT: "待乙方簽",
  FULLY_SIGNED: "已雙簽",
};

export default function VersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<{ templateId: string | null } | null>(null);
  const [selected, setSelected] = useState<number | null>(null); // version number to compare against current

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [versionResponse, contractResponse] = await Promise.all([
        fetch(`/api/contracts/${id}/versions`),
        fetch(`/api/contracts/${id}`),
      ]);
      if (!versionResponse.ok) throw new Error(`版本紀錄 HTTP ${versionResponse.status}`);
      if (!contractResponse.ok) throw new Error(`合約資料 HTTP ${contractResponse.status}`);
      const [v, c] = await Promise.all([versionResponse.json(), contractResponse.json()]);
      setData(v);
      if (c?.contract) setContract({ templateId: c.contract.templateId });
      if (v.versions?.length > 0) {
        setSelected((current) => v.versions.some((version: VersionRow) => version.version === current) ? current : v.versions[0].version);
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const tpl = contract?.templateId ? getTemplate(contract.templateId) : null;
  const snapshot = selected != null ? data?.versions.find((v) => v.version === selected) : null;
  const changes = snapshot && data?.current ? diffValues(snapshot.values, data.current.values) : [];

  function labelFor(key: string): string {
    const f = tpl?.fields.find((x) => x.id === key);
    return f?.label ?? key;
  }

  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-versions-page">
        <header className="dg-page-shell dg-versions-header">
          <Link href={`/contracts/${id}`} className="dg-link dg-contract-detail-back">
            <Icon name="arrowLeft" size={12} /> 返回合約
          </Link>
          <h1 className="dg-page-title">版本紀錄</h1>
          <p className="dg-text-secondary">
            每次修改條款都會快照前一版於此。已雙簽合約不可再修改，請改建立新合約。
          </p>
        </header>

        <div className="dg-page-shell dg-versions-content" aria-busy={loading}>
          {loading && !data && <UIState status="loading" title="版本載入中" description="正在取得歷史版本與目前內容。" />}
          {err && !data && (
            <UIState status="error" title="無法讀取版本紀錄" description={`讀取失敗：${err}`} actions={<button className="btn btn-primary" onClick={load}>重新載入</button>} />
          )}
          {err && data && (
            <div className="dg-notice dg-notice--error dg-contract-detail-notice" role="alert">
              <span>重新讀取失敗：{err}。目前顯示上次取得的資料。</span>
              <button className="btn btn-ghost btn-sm" onClick={load}>重新讀取</button>
            </div>
          )}
          {!loading && !err && data && !data.current && (
            <UIState status="error" title="無法查看版本紀錄" description="找不到合約，或你沒有查看此合約版本的權限。" actions={<Link href="/contracts" className="btn btn-ghost">返回合約列表</Link>} />
          )}
          {data?.current && data.versions.length === 0 && (
            <UIState status="empty" title="尚無歷史版本" description="修改合約欄位後，系統會將舊版快照保留於此。" />
          )}
          {data?.current && data.versions.length > 0 && (
          <section className="dg-versions-grid" aria-label="版本比較">
              <div className="dg-versions-column">
                <h2 className="dg-section-title">歷史版本</h2>
                <div className="dg-version-list">
                  {data.versions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelected(v.version)}
                      className={`card dg-card-compact dg-version-option ${selected === v.version ? "dg-card-selected" : ""}`.trim()}
                      aria-pressed={selected === v.version}
                    >
                      <div className="dg-version-option__header">
                        <strong>v{v.version}</strong>
                        {selected === v.version && <span className="chip">已選取</span>}
                      </div>
                      <time className="dg-version-option__meta" dateTime={v.createdAt}>{new Date(v.createdAt).toLocaleString("zh-Hant")}</time>
                      {v.note && (
                        <div className="dg-version-option__note">
                          {v.note}
                        </div>
                      )}
                    </button>
                  ))}
                  <div className="card dg-card-compact dg-version-current" aria-label="目前版本">
                    <strong>目前版本</strong>
                    <div className="dg-version-current__meta">
                      <time dateTime={data.current.updatedAt}>{new Date(data.current.updatedAt).toLocaleString("zh-Hant")}</time>
                      <span>{SIGNING_STATUS_LABEL[data.current.signingStatus] || data.current.signingStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dg-versions-column">
                <h2 className="dg-section-title dg-version-diff-heading">
                  {snapshot ? `v${snapshot.version} → 目前版本（${changes.length} 處變動）` : "請選擇歷史版本"}
                </h2>
                {snapshot && changes.length === 0 && (
                  <div className="card dg-card-body dg-text-secondary" role="status">
                    此版本與目前內容相同。
                  </div>
                )}
                {snapshot && changes.length > 0 && (
                  <div className="dg-version-diff-list">
                    {changes.map((c) => {
                      const inline = inlineDiff(c.before, c.after);
                      return (
                        <article key={c.key} className="card dg-card-compact dg-version-diff-card">
                          <h3 className="dg-subsection-title dg-version-diff-card__title">
                            {labelFor(c.key)} <code>({c.key})</code>
                          </h3>
                          <div className="dg-diff-removed">
                            <strong className="dg-diff-label">移除</strong>
                            <span>{inline.head}<b>{inline.before}</b>{inline.tail}</span>
                          </div>
                          <div className="dg-diff-added">
                            <strong className="dg-diff-label">新增</strong>
                            <span>{inline.head}<b>{inline.after}</b>{inline.tail}</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
          </section>
          )}
        </div>

        <Footer />
      </main>
    </>
  );
}
