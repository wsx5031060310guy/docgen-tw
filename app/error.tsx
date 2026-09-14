"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

export default function ErrorPage({
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
        <section className="card dg-route-state-card dg-route-state-card--error" role="alert" aria-labelledby="error-title">
          <span className="dg-route-state-code" aria-hidden="true">!</span>
          <h1 id="error-title" className="dg-page-title">頁面暫時無法顯示</h1>
          <p className="dg-text-secondary">系統遇到非預期錯誤。重新載入只會重取頁面內容，不會自動重送付款或表單。</p>
          <p className="dg-helper" lang="en">Something went wrong. Retry the page or return home.</p>
          {error.digest && <p className="dg-helper">錯誤識別碼：<code>{error.digest}</code></p>}
          <div className="dg-actions dg-route-state-actions">
            <button className="btn btn-primary" type="button" onClick={() => unstable_retry()}>重新載入</button>
            <Link href="/" className="btn btn-soft">返回首頁</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
