"use client";

import { useState } from "react";
import Link from "next/link";
import { AttachToCaseModal } from "./AttachToCaseModal";
import { ContractPreview } from "./ContractPreview";
import { Icon } from "./Icon";
import { LegalDisclaimer } from "./LegalDisclaimer";
import type { Template, Values } from "@/lib/templates";

type CopyState = "idle" | "success" | "error";

export function ContractComplete({
  template,
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
  template: Template;
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
  const [showAttach, setShowAttach] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const pdfUrl = contractId && signingToken
    ? `/api/contracts/${contractId}/pdf?token=${signingToken}`
    : null;

  async function copyRecipientUrl() {
    if (!recipientUrl) return;
    try {
      await navigator.clipboard.writeText(recipientUrl);
      setCopyState("success");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <div className="dg-page-shell dg-complete-grid">
      <aside className="dg-complete-summary">
        <div className="dg-complete-icon" aria-hidden="true">
          <Icon name="checkCircle" size={26} />
        </div>
        <header className="dg-complete-header">
          <h1 className="dg-page-title">合約已建立</h1>
          <p className="dg-text-secondary">
            {contractId ? `編號 #${contractId}。` : "建立請求已完成。"}
            {recipientUrl
              ? "甲方資料已送出，乙方仍需透過下方連結完成簽署。"
              : "目前未取得乙方簽署連結，請至合約頁確認後續狀態。"}
          </p>
        </header>

        <section className="card dg-card-compact dg-complete-evidence" aria-labelledby="complete-evidence-title">
          <h2 className="dg-complete-card-title" id="complete-evidence-title">
            <Icon name="hash" size={12} />本頁示範標記
          </h2>
          <p className="dg-helper">
            以下時間、遮罩 IP 與短雜湊由瀏覽器產生，只供畫面預覽，不是伺服器雙簽或存證證明。
          </p>
          <div className="dg-complete-evidence__values">
            <div>甲方：{signedA || "—"}</div>
            <div>乙方：{signedB || "—"}</div>
          </div>
        </section>

        {recipientUrl ? (
          <section className="card dg-card-compact dg-complete-share" aria-labelledby="complete-share-title">
            <h2 className="dg-complete-card-title" id="complete-share-title">乙方待簽連結</h2>
            <code>{recipientUrl}</code>
          </section>
        ) : (
          <div className="dg-notice dg-notice--warning" role="status">
            未取得乙方簽署連結。這不代表乙方已完成簽署。
          </div>
        )}

        <div className="dg-complete-actions" role="group" aria-label="合約完成後操作">
          {pdfUrl ? (
            <a className="btn btn-stamp btn-lg" href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Icon name="download" size={14} />下載 PDF
            </a>
          ) : (
            <button className="btn btn-stamp btn-lg" type="button" disabled>
              <Icon name="download" size={14} />下載 PDF
            </button>
          )}
          {!pdfUrl && <p className="field-help">未取得 PDF 所需 token，暫不可下載。</p>}

          <button className="btn btn-ghost" type="button" onClick={copyRecipientUrl} disabled={!recipientUrl}>
            <Icon name="copy" size={14} />複製乙方待簽連結
          </button>
          {copyState === "success" && (
            <p className="dg-notice dg-notice--success dg-complete-copy-state" role="status" aria-live="polite">
              分享連結已複製。
            </p>
          )}
          {copyState === "error" && (
            <p className="dg-notice dg-notice--error dg-complete-copy-state" role="alert">
              無法複製連結，請手動選取上方網址。
            </p>
          )}

          {contractId && (
            <Link href={`/contracts/${contractId}`} className="btn btn-soft">
              <Icon name="folder" size={14} />開啟合約頁（管理 milestone）
            </Link>
          )}
          {contractId && (
            <button className="btn btn-soft" type="button" onClick={() => setShowAttach(true)}>
              <Icon name="folder" size={14} />指派到案件
            </button>
          )}
          <button className="btn btn-soft" type="button" onClick={onHome}>
            <Icon name="home" size={14} />回首頁
          </button>
        </div>
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

      <section className="dg-complete-preview" aria-label="已建立合約預覽">
        <ContractPreview
          template={template}
          values={values}
          sigA={sigA}
          sigB={sigB}
          scale={0.92}
        />
      </section>
    </div>
  );
}
