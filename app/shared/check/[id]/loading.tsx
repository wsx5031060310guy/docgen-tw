import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

export default function LoadingSharedCheck() {
  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-route-state-page" aria-busy="true">
        <section className="card dg-route-state-card" role="status" aria-live="polite">
          <span className="dg-route-state-code" aria-hidden="true">…</span>
          <h1 className="dg-page-title">正在載入分享快照</h1>
          <p className="dg-text-secondary">正在讀取檢查結果與合約原文，請稍候。</p>
          <div className="dg-route-state-skeletons" aria-hidden="true">
            <span className="dg-skeleton" />
            <span className="dg-skeleton dg-route-state-skeleton-short" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
