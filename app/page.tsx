import Link from "next/link";
import { listTemplates, templates } from "@/lib/contract-engine";

export default function Home() {
  const all = listTemplates();
  return (
    <main className="mx-auto max-w-5xl p-8 sm:p-12 space-y-10">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">DocGen TW</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-300">台灣法律合約自動產生與電子簽約平台</p>
        <p className="text-sm text-zinc-500">
          所有模板皆參考中華民國民法、勞動基準法、電子簽章法等現行法令制定。Jurisdiction：{templates.jurisdiction}．Last reviewed：{templates.lastReviewed}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((t) => (
          <article
            key={t.id}
            className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-xs uppercase tracking-wide text-zinc-500">{t.category}</div>
            <h2 className="mt-1 text-lg font-semibold">{t.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{t.description}</p>
            <Link
              href={`/contracts/new?template=${t.id}`}
              className="mt-4 inline-block rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
            >
              使用此模板
            </Link>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200">
        <strong className="block mb-1">法律免責聲明</strong>
        {templates.disclaimer}
      </section>
    </main>
  );
}
