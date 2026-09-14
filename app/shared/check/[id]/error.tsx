"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

export default function SharedCheckError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-route-state-page">
        <section className="card dg-route-state-card dg-route-state-card--error" role="alert">
          <span className="dg-route-state-code" aria-hidden="true">!</span>
          <h1 className="dg-page-title">無法載入分享快照</h1>
          <p className="dg-text-secondary">資料庫或網路暫時無法回應。你可以安全重試；此操作只會重新讀取快照。</p>
          {error.digest && <p className="dg-helper">錯誤識別碼：<code>{error.digest}</code></p>}
          <div className="dg-actions dg-route-state-actions">
            <button className="btn btn-primary" type="button" onClick={() => unstable_retry()}>重新載入</button>
            <Link href="/check" className="btn btn-soft">返回風險快檢</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
