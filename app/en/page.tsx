"use client";
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
        <section className="container dg-hero-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div className="row gap-2" style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <span style={{ width: 24, height: 1, background: "var(--ink-muted)" }} />
              {t(L, "home.tag")}
            </div>
            <h1 style={{ fontSize: 56, lineHeight: 1.1 }}>
              {t(L, "home.headline_pre")} <br />
              <span style={{ fontFamily: "var(--font-italic)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>
                {t(L, "home.headline_italic")}
              </span>{" "}
              <br />
              {t(L, "home.headline_post")}
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--ink-soft)", maxWidth: 580 }}>
              {t(L, "home.subhead")}
              <span style={{ color: "var(--ink)" }}>{t(L, "home.subhead_emphasis")}</span>
            </p>
            <div style={{ marginTop: 6, marginBottom: -8 }}>
              <BillingBanner compact />
            </div>
            <div className="row gap-3 dg-hero-cta" style={{ marginTop: 6 }}>
              <Link href="/en/contracts/new" className="btn btn-primary btn-lg">
                <Icon name="sparkles" size={15} />
                {t(L, "home.cta_start")}
              </Link>
              <a
                className="btn btn-ghost btn-lg"
                onClick={() => document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Icon name="bookOpen" size={15} />
                {t(L, "home.cta_browse")}
              </a>
            </div>
            <div className="row gap-3" style={{ marginTop: 12, fontSize: 12.5, color: "var(--ink-muted)" }}>
              <span className="row gap-1">
                <Icon name="checkCircle" size={13} style={{ color: "var(--primary)" }} />
                {t(L, "home.trust.signlaw")}
              </span>
              <span style={{ width: 1, height: 12, background: "var(--line)" }} />
              <span className="row gap-1">
                <Icon name="lock" size={13} style={{ color: "var(--primary)" }} />
                SSL encrypted
              </span>
              <span style={{ width: 1, height: 12, background: "var(--line)" }} />
              <span className="row gap-1">
                <Icon name="hash" size={13} style={{ color: "var(--primary)" }} />
                Signature hash on record
              </span>
            </div>
          </div>
        </section>

        <section className="container" style={{ padding: "0 32px 48px" }}>
          <TrustBar
            items={[
              { icon: "fileText", value: "12,480", label: t(L, "home.trust.contracts") },
              { icon: "scale", value: "23 laws", label: t(L, "home.trust.laws") },
              { icon: "shieldCheck", value: "§4", label: t(L, "home.trust.signlaw") },
              { icon: "users", value: "4,200+", label: t(L, "home.trust.users") },
              { icon: "clock", value: "< 3 min", label: t(L, "home.trust.time") },
            ]}
          />
        </section>

        <section id="templates" className="container" style={{ padding: "24px 32px 64px" }}>
          <h2 style={{ marginBottom: 12 }}>Pick a template</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            Contract bodies are produced in <b>Traditional Chinese</b> (governing-law text);
            the English landing pages are explanations for international counterparties.
            Each template lists the Taiwan statutes it cites.
          </p>
          <div className="dg-templates-grid">
            {TEMPLATES.map((tpl) => (
              <TemplateCard key={tpl.id} tpl={tpl} />
            ))}
          </div>
        </section>

        <section className="container" style={{ padding: "0 32px 60px" }}>
          <LegalDisclaimer />
        </section>

        <Footer />
      </main>
    </>
  );
}
