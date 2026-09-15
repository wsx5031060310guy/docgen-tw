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
const L = "en" as const;

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
      <main className="page paper-bg dg-template-page">
        <header className="dg-page-shell dg-page-shell--reading dg-template-hero">
          <div className="dg-eyebrow dg-template-category" lang="zh-Hant">
            <Icon name={tpl.icon} size={13} /> {tpl.category}
          </div>
          <h1 className="dg-page-title" lang="zh-Hant">{tpl.name}</h1>
          <p className="dg-body dg-template-intro">
            {copy ? copy.intent : <span lang="zh-Hant">{tpl.description}</span>}
          </p>
          <div className="dg-notice dg-notice--info dg-en-template-language-note">
            <strong>Language note:</strong> the rendered contract body is in <strong>Traditional Chinese</strong>,
            the governing language. This English page helps international counterparties understand what they will sign.
          </div>
          <div className="dg-actions dg-template-actions">
            <Link href={`/contracts/new?tpl=${tpl.id}`} className="btn btn-primary btn-lg">
              <Icon name="sparkles" size={14} />Use this template
            </Link>
            <a href="#legal" className="btn btn-soft">
              <Icon name="scale" size={13} />See legal basis
            </a>
            <Link href={`/templates/${tpl.id}`} className="btn btn-ghost">
              中文版
            </Link>
          </div>
        </header>

        {copy && (
          <section className="dg-page-shell dg-page-shell--reading dg-template-section">
            <h2 className="dg-section-title">Who uses this</h2>
            <ul className="dg-body dg-template-list">
              {copy.useCases.map((useCase) => <li key={useCase}>{useCase}</li>)}
            </ul>
          </section>
        )}

        {copy && (
          <section className="dg-page-shell dg-page-shell--reading dg-template-section">
            <h2 className="dg-section-title">Key clauses · why they are worded this way</h2>
            <div className="dg-template-clause-list">
              {copy.keyClauses.map((clause) => (
                <article key={clause.name} className="card dg-card-compact dg-template-clause">
                  <div className="dg-template-clause-header">
                    <h3 className="dg-subsection-title">{clause.name}</h3>
                    {clause.ref && <span className="chip chip-mono">{clause.ref}</span>}
                  </div>
                  <p className="dg-text-secondary">{clause.why}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {copy && (
          <section className="dg-page-shell dg-page-shell--reading dg-template-section">
            <h2 className="dg-section-title">Common pitfalls</h2>
            <ul className="dg-body dg-template-list">
              {copy.pitfalls.map((pitfall) => <li key={pitfall}>{pitfall}</li>)}
            </ul>
          </section>
        )}

        <section id="legal" className="dg-page-shell dg-page-shell--reading dg-template-section dg-template-anchor">
          <h2 className="dg-section-title">Statutes referenced</h2>
          <div className="dg-template-legal-list" lang="zh-Hant">
            {tpl.legal.map((law) => <span key={law} className="chip chip-mono">{law}</span>)}
          </div>
        </section>

        {copy && copy.faqs.length > 0 && (
          <section className="dg-page-shell dg-page-shell--reading dg-template-section">
            <h2 className="dg-section-title">FAQ</h2>
            <div className="dg-faq">
              {copy.faqs.map((faq) => (
                <details key={faq.q} className="card dg-faq-item">
                  <summary className="dg-faq-summary">
                    <span>{faq.q}</span>
                    <span className="dg-faq-toggle" aria-hidden="true">
                      <span className="dg-faq-toggle-open">Expand</span>
                      <span className="dg-faq-toggle-close">Collapse</span>
                    </span>
                  </summary>
                  <p className="dg-text-secondary dg-faq-answer">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="dg-page-shell dg-page-shell--reading dg-template-section">
          <div className="card dg-card-body dg-template-cta">
            <h2 className="dg-section-title">Ready?</h2>
            <p className="dg-text-secondary">
              Complete a three-minute form, cite Taiwan statutes automatically, then collect both e-signatures with an IP and signature-hash audit trail.
            </p>
            <Link href={`/contracts/new?tpl=${tpl.id}`} className="btn btn-primary dg-template-cta-action">
              <Icon name="sparkles" size={13} />Create <span lang="zh-Hant">{tpl.name}</span>
            </Link>
          </div>
        </section>

        <section className="dg-page-shell dg-page-shell--reading dg-template-disclaimer-section">
          <LegalDisclaimer headingLevel={2} locale={L} />
        </section>
      </main>
      <Footer locale={L} />
    </>
  );
}
