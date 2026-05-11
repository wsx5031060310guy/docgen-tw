"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
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

export default function VersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [contract, setContract] = useState<{ templateId: string | null } | null>(null);
  const [selected, setSelected] = useState<number | null>(null); // version number to compare against current

  async function load() {
    try {
      const [v, c] = await Promise.all([
        fetch(`/api/contracts/${id}/versions`).then((r) => r.json()),
        fetch(`/api/contracts/${id}`).then((r) => (r.ok ? r.json() : null)),
      ]);
      setData(v);
      if (c?.contract) setContract({ templateId: c.contract.templateId });
      if (v.versions?.length > 0 && selected == null) setSelected(v.versions[0].version);
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  useEffect(() => { load(); }, [id]);

  if (err) return <main style={{ padding: 40 }}>讀取失敗：{err}</main>;
  if (!data) return <main style={{ padding: 40 }}>載入中…</main>;
  if (!data.current) return <main style={{ padding: 40 }}>找不到合約或非合約擁有者</main>;

  const tpl = contract?.templateId ? getTemplate(contract.templateId) : null;
  const snapshot = selected != null ? data.versions.find((v) => v.version === selected) : null;
  const changes = snapshot ? diffValues(snapshot.values, data.current.values) : [];

  function labelFor(key: string): string {
    const f = tpl?.fields.find((x) => x.id === key);
    return f?.label ?? key;
  }

  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "32px 32px 16px", maxWidth: 1000 }}>
          <Link href={`/contracts/${id}`} style={{ fontSize: 13, color: "var(--ink-muted)" }}>
            <Icon name="arrowLeft" size={12} /> 返回合約
          </Link>
          <h1 style={{ fontSize: 32, marginTop: 12 }}>版本紀錄</h1>
          <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 6 }}>
            每次修改條款都會快照前一版於此。已雙簽合約不可再修改，請改建立新合約。
          </p>
        </section>

        {data.versions.length === 0 ? (
          <section className="container" style={{ padding: "0 32px 64px", maxWidth: 1000 }}>
            <div className="card" style={{ padding: 24, color: "var(--ink-muted)", textAlign: "center" }}>
              <Icon name="fileText" size={20} />
              <div style={{ marginTop: 8 }}>尚未產生歷史版本。當你修改合約欄位後，舊版會自動快照於此。</div>
            </div>
          </section>
        ) : (
          <section className="container" style={{ padding: "0 32px 24px", maxWidth: 1000 }}>
            <div className="dg-fields-2col" style={{ gap: 16, alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: 18, marginBottom: 10 }}>歷史版本</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {data.versions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelected(v.version)}
                      className="card"
                      style={{
                        padding: "10px 12px", textAlign: "left", cursor: "pointer",
                        background: selected === v.version ? "var(--primary-soft)" : "var(--bg-elev)",
                        border: `1px solid ${selected === v.version ? "var(--primary)" : "var(--line)"}`,
                        borderRadius: "var(--radius)",
                      }}
                    >
                      <div className="row gap-2"><b>v{v.version}</b>
                        <span style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>
                          {new Date(v.createdAt).toLocaleString("zh-Hant")}
                        </span>
                      </div>
                      {v.note && (
                        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
                          {v.note}
                        </div>
                      )}
                    </button>
                  ))}
                  <div className="card" style={{
                    padding: "10px 12px", background: "#e8f5ed",
                    border: "1px solid #bfe1c8", color: "#1f5a35",
                  }}>
                    <b>目前版本</b>
                    <div style={{ fontSize: 11.5, marginTop: 4 }}>
                      {new Date(data.current.updatedAt).toLocaleString("zh-Hant")} · {data.current.signingStatus}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: 18, marginBottom: 10 }}>
                  {snapshot ? `v${snapshot.version} → 目前版本（${changes.length} 處變動）` : "請選擇歷史版本"}
                </h2>
                {snapshot && changes.length === 0 && (
                  <div className="card" style={{ padding: 16, color: "var(--ink-muted)" }}>
                    此版本與目前內容相同。
                  </div>
                )}
                {snapshot && changes.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {changes.map((c) => {
                      const inline = inlineDiff(c.before, c.after);
                      return (
                        <div key={c.key} className="card" style={{
                          padding: 12, background: "var(--bg-elev)",
                          border: "1px solid var(--line)", borderRadius: "var(--radius)",
                        }}>
                          <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 4 }}>
                            {labelFor(c.key)} <code style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>({c.key})</code>
                          </div>
                          <div style={{
                            background: "#fde9e9", color: "#7a1f1f", padding: "6px 10px",
                            borderRadius: 4, fontSize: 13, marginBottom: 4, whiteSpace: "pre-wrap",
                          }}>
                            − {inline.head}<b style={{ background: "#f1b5b5" }}>{inline.before}</b>{inline.tail}
                          </div>
                          <div style={{
                            background: "#e8f5ed", color: "#1f5a35", padding: "6px 10px",
                            borderRadius: 4, fontSize: 13, whiteSpace: "pre-wrap",
                          }}>
                            + {inline.head}<b style={{ background: "#bfe1c8" }}>{inline.after}</b>{inline.tail}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </main>
    </>
  );
}
