import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { LawyerReferralCTA } from "@/components/LawyerReferralCTA";

export const metadata = {
  title: "Legal Notice / Lawyer Referral · DocGen TW",
  description:
    "DocGen TW provides document automation and risk hints, not legal advice. For litigation, large amounts, or custom clauses, we refer you to a partner lawyer.",
  alternates: { canonical: "/en/disclaimer", languages: { "zh-Hant": "/disclaimer" } },
};

const L = "en" as const;

const FAQ = [
  {
    q: "Is DocGen TW a law firm?",
    a: "No. We provide contract templates, e-signing, and risk hints — document-automation tools. We do not practice law or give legal advice. Contracts generated here may have evidentiary effect under Taiwan's Electronic Signatures Act §4/§9, but they do not replace lawyer review.",
  },
  {
    q: "When should I hire a lawyer instead of just using DocGen TW?",
    a: "Hire counsel for amounts over NT$500,000 or material to your business; cross-border deals or foreign law; existing disputes or looming litigation; custom clauses or regulated industries; equity, M&A, or IP assignments; and any potentially criminal matter.",
  },
  {
    q: "What do the red, yellow, and green flags mean?",
    a: "Rule-based checks flag common high-risk clauses such as excessive penalties, unlimited confidentiality, unilateral termination, and interest above the Civil Code §205 cap. Red strongly recommends lawyer review; yellow is negotiable; green matches common market practice. These are hints, not legal advice.",
  },
  {
    q: "Will DocGen TW mail my certified letter or dunning notice?",
    a: "No. We produce the PDF draft only. Users must take a certified-letter draft to a Taiwan post office and send it through the legally effective registered-mail channel. We do not mail it on a user's behalf.",
  },
  {
    q: "Is my contract data safe?",
    a: "Traffic uses SSL; signature images are stored on Vercel Blob; the audit trail retains IP address, timestamp, and the signature image's SHA-256 hash. We do not share contract bodies with third parties, but may use anonymized statistics to improve the product.",
  },
  {
    q: "How does lawyer referral work?",
    a: "The referral form asks for a case summary, matter type, budget, and city. Within one to two business days, we suggest one or two partner lawyers in Taiwan. You contact them directly and agree on fees; DocGen TW takes no referral commission. The form is in Traditional Chinese.",
  },
];

export default function DisclaimerEn() {
  return (
    <>
      <TopNav />
      <main className="page paper-bg dg-legal-page">
        <header className="dg-page-shell dg-page-shell--reading dg-reading-header">
          <div className="dg-eyebrow dg-reading-eyebrow">
            <Icon name="scale" size={13} />Our position
          </div>
          <h1 className="dg-page-title dg-reading-title">
            Document automation · risk hints ·
            <br />
            <span className="dg-reading-title-accent">lawyer referral</span>
          </h1>
          <p className="dg-body dg-reading-intro">
            DocGen TW is a <strong>contract SaaS tool</strong>, not a law firm. We do three things:
          </p>
          <ol className="dg-reading-lead-list">
            <li><strong>Document automation:</strong> 10 Taiwan-law templates, dynamic forms, instant PDFs, and two-party e-signing.</li>
            <li><strong>Risk hints:</strong> rule-based red, yellow, and green flags with statute citations and practical suggestions.</li>
            <li><strong>Lawyer referral:</strong> for red flags, cross-border work, or disputes, we can suggest partner lawyers. You negotiate fees directly; DocGen TW takes no cut.</li>
          </ol>
        </header>

        <section className="dg-page-shell dg-page-shell--reading dg-reading-section" aria-labelledby="legal-boundary-title-en">
          <div className="dg-notice dg-notice--warning dg-reading-boundary">
            <h2 id="legal-boundary-title-en" className="dg-section-title dg-reading-card-title">
              <Icon name="fileWarn" size={16} />What we do not do
            </h2>
            <ul className="dg-prose-list">
              <li>We do not provide case-specific legal advice or litigation strategy.</li>
              <li>We do not appear in court, draft briefs, or mail certified letters for users.</li>
              <li>We do not guarantee enforceability in a specific matter or the chance of winning.</li>
              <li>We do not review contracts that violate mandatory law, public order, or third-party rights.</li>
            </ul>
          </div>
        </section>

        <section className="dg-page-shell dg-page-shell--reading dg-reading-section" aria-labelledby="legal-faq-title-en">
          <h2 id="legal-faq-title-en" className="dg-section-title dg-reading-section-title">FAQ</h2>
          <div className="dg-faq">
            {FAQ.map((faq) => (
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

        <section id="referral" className="dg-page-shell dg-page-shell--reading dg-referral-section" aria-labelledby="referral-title-en">
          <h2 id="referral-title-en" className="dg-section-title dg-reading-section-title">Request a lawyer referral</h2>
          <LawyerReferralCTA
            variant="card"
            context="general legal consultation (EN)"
            headingLevel={3}
            locale={L}
          />
          <p className="dg-reading-meta dg-en-referral-meta">
            The referral form is in Traditional Chinese and opens on the full referral page.
          </p>
          <div className="dg-reading-meta">
            Last updated 2026. If this page conflicts with our Terms of Service, the Terms govern.
            <br />
            DocGen TW is a <Link href="/en" className="dg-link">contract automation platform</Link>, not a licensed law firm.
          </div>
        </section>
      </main>
      <Footer locale={L} />
    </>
  );
}
