import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { TrustBar } from "@/components/TrustBar";
import { TemplateCard } from "@/components/TemplateCard";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { BillingBanner } from "@/components/BillingBanner";
import { TEMPLATES } from "@/lib/templates";
import { t } from "@/lib/i18n/dict";

const L = "en" as const;

export default function HomeEn() {
  return (
    <>
      <TopNav />
      <main className="page paper-bg">
        <section className="dg-page-shell dg-hero-grid dg-hero-grid--single">
          <div className="dg-home-hero-copy">
            <div className="dg-eyebrow dg-home-eyebrow">
              <span className="dg-home-eyebrow-line" aria-hidden="true" />
              {t(L, "home.tag")}
            </div>
            <h1 className="dg-page-title dg-home-title">
              {t(L, "home.headline_pre")}
              <br />
              <span className="dg-check-title-accent">{t(L, "home.headline_italic")}</span>
              <br />
              {t(L, "home.headline_post")}
            </h1>
            <p className="dg-body dg-home-lead">
              {t(L, "home.subhead")}
              <strong>{t(L, "home.subhead_emphasis")}</strong>
            </p>
            <div className="dg-home-billing">
              <BillingBanner compact locale={L} />
            </div>
            <div className="dg-actions dg-hero-cta">
              <Link href="/contracts/new" className="btn btn-primary btn-lg">
                <Icon name="sparkles" size={15} />
                {t(L, "home.cta_start")}
              </Link>
              <a href="#templates" className="btn btn-ghost btn-lg">
                <Icon name="bookOpen" size={15} />
                {t(L, "home.cta_browse")}
              </a>
            </div>
            <div className="dg-home-trust-notes">
              <span className="row gap-1">
                <Icon name="checkCircle" size={13} style={{ color: "var(--primary)" }} />
                {t(L, "home.trust.signlaw")}
              </span>
              <span aria-hidden="true" style={{ width: 1, height: 12, background: "var(--line)" }} />
              <span className="row gap-1">
                <Icon name="lock" size={13} style={{ color: "var(--primary)" }} />
                SSL encrypted
              </span>
              <span aria-hidden="true" style={{ width: 1, height: 12, background: "var(--line)" }} />
              <span className="row gap-1">
                <Icon name="hash" size={13} style={{ color: "var(--primary)" }} />
                Signature hash on record
              </span>
            </div>
          </div>
        </section>

        <section className="dg-page-shell dg-home-trust-section" aria-label="Service outcomes and trust indicators">
          <TrustBar
            items={[
              { icon: "fileText", value: "12,480", label: t(L, "home.trust.contracts") },
              { icon: "scale", value: "23", label: t(L, "home.trust.laws") },
              { icon: "shieldCheck", value: "§4", label: t(L, "home.trust.signlaw") },
              { icon: "users", value: "4,200+", label: t(L, "home.trust.users") },
              { icon: "clock", value: "< 3 min", label: t(L, "home.trust.time") },
            ]}
          />
        </section>

        <section id="templates" className="dg-page-shell dg-section dg-home-section">
          <div className="dg-eyebrow">Contract templates</div>
          <h2 className="dg-section-title dg-home-section-title">Pick a template</h2>
          <p className="dg-body dg-home-pricing-copy dg-en-home-template-note">
            Contract bodies are produced in <strong>Traditional Chinese</strong> as the governing-law text.
            These English pages help international counterparties understand what they will sign.
            Each template lists the Taiwan statutes it cites.
          </p>
          <div className="dg-templates-grid">
            {TEMPLATES.map((tpl) => (
              <TemplateCard key={tpl.id} tpl={tpl} locale={L} />
            ))}
          </div>
        </section>

        <section className="dg-page-shell dg-home-disclaimer-section">
          <LegalDisclaimer locale={L} />
        </section>
      </main>
      <Footer locale={L} />
    </>
  );
}
