import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-route-state-page">
        <section className="card dg-route-state-card" aria-labelledby="not-found-title">
          <span className="dg-route-state-code" aria-hidden="true">404</span>
          <h1 id="not-found-title" className="dg-page-title">找不到這個頁面</h1>
          <p className="dg-text-secondary">網址可能有誤，或頁面已移動。請返回首頁繼續使用。</p>
          <p className="dg-helper" lang="en">Page not found. Check the URL or return home.</p>
          <div className="dg-actions dg-route-state-actions">
            <Link href="/" className="btn btn-primary">返回首頁</Link>
            <Link href="/check" className="btn btn-soft">合約風險快檢</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
