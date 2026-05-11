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

const FAQ = [
  {
    q: "Is DocGen TW a law firm?",
    a: "No. We provide contract templates, e-signing, and risk hints — document-automation tools. We do not practice law, do not give legal advice. The contracts we generate have evidentiary effect under the Taiwan Electronic Signatures Act §4/§9 (same status as paper signatures) but they do not replace lawyer review.",
  },
  {
    q: "When should I hire a lawyer instead of just using DocGen TW?",
    a: "(1) Amounts over NT$500,000 or material to your business; (2) Cross-border deals or foreign law; (3) Existing dispute, certified letter received, looming litigation; (4) Custom clauses, regulated industries (finance, biotech, real-estate transfers); (5) Equity, M&A, IP assignments; (6) Anything criminal (intimidation, fraud, trade-secret theft).",
  },
  {
    q: "What do the red / yellow / green flags mean?",
    a: "Rule-based checks flag common high-risk clauses (penalty > 0.5%/day, NDA term unlimited, unilateral termination, Civil Code §205 16% interest cap, etc.). Red = strongly recommend a lawyer. Yellow = acceptable but negotiable. Green = matches market practice. This is a hint, not legal advice.",
  },
  {
    q: "Will DocGen TW mail my certified letter / dunning notice for me?",
    a: "No. We produce the PDF draft only. Users must visit a Taiwan post office and send it as a certified (存證信函) registered mail — that's the legally effective channel. Mailing on your behalf would be practising law, which we do not.",
  },
  {
    q: "Is my contract data safe?",
    a: "(1) SSL in transit; (2) Signature images stored on Vercel Blob; (3) Audit trail keeps IP, timestamp, SHA-256 of signature image; (4) We never share contract bodies with third parties, but may use anonymised statistics for product improvement.",
  },
  {
    q: "How does lawyer referral work?",
    a: "Submit the form below with the case summary, type, budget, and your city. Within 1–2 business days we suggest 1–2 partner lawyers in Taiwan. You contact them directly and agree on the fee. DocGen TW takes no referral commission.",
  },
];

export default function DisclaimerEn() {
  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="container" style={{ padding: "48px 32px 24px", maxWidth: 860 }}>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            <Icon name="scale" size={13} />
            Our position
          </div>
          <h1 style={{ fontSize: 44, marginBottom: 18 }}>
            Document automation · risk hints ·
            <br />
            <span style={{ fontFamily: "var(--font-italic)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>
              lawyer referral
            </span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--ink-soft)" }}>
            DocGen TW is a <b>contract SaaS</b>, not a law firm. We do three things:
          </p>
          <ol style={{ fontSize: 15, lineHeight: 1.85, color: "var(--ink)", paddingLeft: 22, marginTop: 12 }}>
            <li><b>Document automation:</b> 10 Taiwan-law templates + dynamic forms + instant PDF + dual e-signature.</li>
            <li><b>Risk hints:</b> rule-based red/yellow/green flags with statute citations and concrete fix suggestions.</li>
            <li><b>Lawyer referral:</b> when the engine detects red flags or complex situations, we suggest a partner lawyer. Fees are negotiated directly with the lawyer; DocGen TW takes no cut.</li>
          </ol>
        </section>

        <section className="container" style={{ padding: "12px 32px 24px", maxWidth: 860 }}>
          <div className="card" style={{
            padding: 22, background: "var(--amber-50)", border: "1px solid #f0d9a4",
            borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div className="row gap-2" style={{ alignItems: "center" }}>
              <Icon name="fileWarn" size={16} style={{ color: "var(--amber-600)" }} />
              <b style={{ color: "#5b3f10" }}>What we do NOT do</b>
            </div>
            <ul style={{ fontSize: 14, lineHeight: 1.8, color: "#7a5a2a", paddingLeft: 20, margin: 0 }}>
              <li>No case-specific legal advice or litigation strategy.</li>
              <li>No court appearances, no briefs, no posting certified letters on your behalf.</li>
              <li>No guarantee on enforceability for a specific case or chance of winning.</li>
              <li>No review of contracts that violate mandatory law, public order, or third-party rights.</li>
            </ul>
          </div>
        </section>

        <section className="container" style={{ padding: "24px 32px 24px", maxWidth: 860 }}>
          <h2 style={{ fontSize: 28, marginBottom: 20 }}>FAQ</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FAQ.map((f, i) => (
              <details key={i} className="card" style={{ padding: 18, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
                <summary style={{ fontWeight: 600, fontSize: 15, cursor: "pointer", listStyle: "none" }}>{f.q}</summary>
                <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.75, color: "var(--ink-soft)" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="referral" className="container" style={{ padding: "24px 32px 64px", maxWidth: 860 }}>
          <LawyerReferralCTA variant="card" context="general legal consultation (EN)" />
          <div style={{ marginTop: 20, fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.7 }}>
            Last updated 2026. If this page conflicts with our Terms of Service, the Terms govern.
            <br />
            DocGen TW is a <Link href="/en" style={{ textDecoration: "underline" }}>contract automation platform</Link>, not a licensed law firm.
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
