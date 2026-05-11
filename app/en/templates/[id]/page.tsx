import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { JsonLd } from "@/components/JsonLd";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import { TEMPLATE_COPY_EN } from "@/lib/i18n/template-copy-en";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://docgen-tw.vercel.app";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tpl = getTemplate(id);
  if (!tpl) return { title: "Template not found" };
  return {
    title: `${tpl.name} · Taiwan-law contract template · DocGen TW`,
    description: `${tpl.name} — references ${tpl.legal.join(", ")}. Fill the form, sign with both parties, audit-trail kept. Contract body in Traditional Chinese (governing law).`,
    alternates: {
      canonical: `/en/templates/${id}`,
      languages: {
        "zh-Hant": `/templates/${id}`,
        en: `/en/templates/${id}`,
      },
    },
    openGraph: {
      title: `${tpl.name} · Taiwan-law contract generator`,
      description: TEMPLATE_COPY_EN[id]?.intent ?? tpl.description,
      locale: "en_US",
    },
  };
}

export default async function TemplateLandingEn({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tpl = getTemplate(id);
  if (!tpl) notFound();
  const copy = TEMPLATE_COPY_EN[id];

  const pageUrl = `${SITE_URL}/en/templates/${tpl.id}`;
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: tpl.name,
    serviceType: "Contract document automation",
    provider: { "@type": "Organization", name: "DocGen TW", url: SITE_URL },
    areaServed: { "@type": "Country", name: "Taiwan" },
    description: copy?.intent ?? tpl.description,
    url: pageUrl,
    inLanguage: "en",
    offers: { "@type": "Offer", price: "99", priceCurrency: "TWD", availability: "https://schema.org/InStock" },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en` },
      { "@type": "ListItem", position: 2, name: tpl.category, item: `${SITE_URL}/en#templates` },
      { "@type": "ListItem", position: 3, name: tpl.name, item: pageUrl },
    ],
  };
  const faqLd =
    copy && copy.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: "en",
          mainEntity: copy.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <>
      <TopNav />
      <JsonLd data={serviceLd} />
      <JsonLd data={breadcrumbLd} />
      {faqLd && <JsonLd data={faqLd} />}
      <main className="page paper-bg">
        <section className="container" style={{ padding: "32px 32px 16px", maxWidth: 900 }}>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            <Icon name={tpl.icon} size={13} /> {tpl.category}
          </div>
          <h1 style={{ fontSize: 44, lineHeight: 1.1 }}>{tpl.name}</h1>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--ink-soft)", marginTop: 12 }}>
            {copy?.intent ?? tpl.description}
          </p>
          <div style={{
            padding: "10px 14px", marginTop: 14, fontSize: 13.5,
            background: "var(--bg-elev)", border: "1px solid var(--line)",
            borderRadius: "var(--radius)", color: "var(--ink-soft)", lineHeight: 1.6,
          }}>
            <b>Language note:</b> the rendered contract body is in <b>Traditional Chinese</b> (Taiwan-law governing language).
            This page is the English explainer for international counterparties to understand what they will sign.
          </div>
          <div className="row gap-2" style={{ marginTop: 18, flexWrap: "wrap" }}>
            <Link href={`/en/contracts/new?tpl=${tpl.id}`} className="btn btn-primary btn-lg">
              <Icon name="sparkles" size={14} />Use this template
            </Link>
            <a href="#legal" className="btn btn-soft">
              <Icon name="scale" size={13} />See legal basis
            </a>
            <Link href={`/templates/${tpl.id}`} className="btn btn-ghost">
              中文版
            </Link>
          </div>
        </section>

        {copy && (
          <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 900 }}>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>Who uses this</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 22 }}>
              {copy.useCases.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </section>
        )}

        {copy && (
          <section id="legal" className="container" style={{ padding: "12px 32px 24px", maxWidth: 900 }}>
            <h2 style={{ fontSize: 24, marginBottom: 14 }}>Key clauses · why they're worded this way</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {copy.keyClauses.map((c) => (
                <div key={c.name} className="card" style={{
                  padding: 16, background: "var(--bg-elev)",
                  border: "1px solid var(--line)", borderRadius: "var(--radius)",
                }}>
                  <div className="row gap-2" style={{ alignItems: "center", marginBottom: 6 }}>
                    <b style={{ fontSize: 15 }}>{c.name}</b>
                    {c.ref && (
                      <span className="chip chip-mono" style={{ fontSize: 11 }}>{c.ref}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.7, margin: 0 }}>{c.why}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {copy && (
          <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 900 }}>
            <h2 style={{ fontSize: 24, marginBottom: 14 }}>Common pitfalls</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 22 }}>
              {copy.pitfalls.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </section>
        )}

        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 900 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Statutes referenced</h2>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {tpl.legal.map((l) => (
              <span key={l} className="chip chip-mono" style={{ fontSize: 12, padding: "4px 10px" }}>{l}</span>
            ))}
          </div>
        </section>

        {copy && copy.faqs.length > 0 && (
          <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 900 }}>
            <h2 style={{ fontSize: 24, marginBottom: 14 }}>FAQ</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {copy.faqs.map((f) => (
                <details key={f.q} className="card" style={{
                  padding: 16, background: "var(--bg-elev)",
                  border: "1px solid var(--line)", borderRadius: "var(--radius)",
                }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, listStyle: "none" }}>{f.q}</summary>
                  <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: "var(--ink-soft)" }}>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="container" style={{ padding: "24px 32px 24px", maxWidth: 900 }}>
          <div className="card" style={{
            padding: 22, background: "var(--bg-elev)", border: "1px solid var(--line)",
            borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: 10,
          }}>
            <h3 style={{ fontSize: 20 }}>Ready?</h3>
            <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
              3-minute form, auto-cited Taiwan statutes, dual e-signature with IP + hash audit trail.
            </p>
            <Link href={`/en/contracts/new?tpl=${tpl.id}`} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
              <Icon name="sparkles" size={13} />Create {tpl.name}
            </Link>
          </div>
        </section>

        <section className="container" style={{ padding: "12px 32px 64px", maxWidth: 900 }}>
          <LegalDisclaimer />
        </section>

        <Footer />
      </main>
    </>
  );
}
