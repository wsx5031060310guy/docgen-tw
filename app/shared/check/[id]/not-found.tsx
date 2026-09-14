import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

export default function SharedCheckNotFound() {
  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-route-state-page">
        <section className="card dg-route-state-card">
          <span className="dg-route-state-code" aria-hidden="true">404</span>
          <h1 className="dg-page-title">找不到分享快照</h1>
          <p className="dg-text-secondary">連結可能有誤、已被移除，或從未建立。請向分享者確認網址。</p>
          <div className="dg-actions dg-route-state-actions">
            <Link href="/check" className="btn btn-primary">開始新的風險快檢</Link>
            <Link href="/" className="btn btn-soft">返回首頁</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
