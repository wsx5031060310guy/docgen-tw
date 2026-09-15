"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { DEFAULT_LOCALE, t, type Locale } from "@/lib/i18n/dict";

interface Status {
  plan: "FREE" | "PRO";
  periodEnd: string | null;
  usedThisMonth: number;
  remaining: number | "unlimited";
  quotaExceeded: boolean;
  month: string;
}

export function BillingBanner({
  compact,
  locale = DEFAULT_LOCALE,
}: {
  compact?: boolean;
  locale?: Locale;
}) {
  const [s, setS] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing/status")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Status>;
      })
      .then((status) => {
        if (!cancelled) setS(status);
      })
      .catch(() => {
        if (!cancelled) {
          setS(null);
          setUnavailable(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const className = `dg-notice dg-billing-banner${compact ? " dg-billing-banner--compact" : ""}`;

  function retry() {
    setLoading(true);
    setUnavailable(false);
    setRequestKey((key) => key + 1);
  }

  if (loading) {
    return (
      <div className={`${className} dg-notice--info`} role="status" aria-live="polite" aria-busy="true">
        <Icon name="loader" size={14} className="spin" />
        <span>{t(locale, "billing.loading")}</span>
      </div>
    );
  }

  if (unavailable || !s) {
    return (
      <div className={`${className} dg-notice--error`} role="alert">
        <div className="dg-billing-banner__message">
          <Icon name="alertOctagon" size={14} />
          <span>{t(locale, "billing.unavailable")}</span>
        </div>
        <button className="btn btn-ghost btn-sm" type="button" onClick={retry}>
          {t(locale, "billing.retry")}
        </button>
      </div>
    );
  }

  if (s.plan === "PRO") {
    const ends = s.periodEnd ? new Date(s.periodEnd).toLocaleDateString(locale) : "—";
    return (
      <div className={`${className} dg-notice--success`} role="status">
        <Icon name="shieldCheck" size={14} />
        <span><b>{t(locale, "billing.pro_active")}</b> {t(locale, "billing.unlimited")}{t(locale, "billing.period_until")} {ends}</span>
      </div>
    );
  }

  const used = s.usedThisMonth;
  const rem = s.remaining === "unlimited" ? "∞" : s.remaining;
  const exceeded = s.quotaExceeded;
  return (
    <div
      className={`${className} ${exceeded ? "dg-notice--error" : "dg-notice--info"}`}
      role={exceeded ? "alert" : "status"}
    >
      <div className="dg-billing-banner__message">
        <Icon name={exceeded ? "alertOctagon" : "info"} size={14} />
        <span>
          <b>{t(locale, "billing.free_plan")}</b> {t(locale, "billing.used_prefix")} <b>{used}</b> / 3 {t(locale, "billing.documents")}
          {rem !== "∞" && <>{t(locale, "billing.remaining_prefix")} <b>{rem}</b> {t(locale, "billing.documents")}</>}
        </span>
      </div>
      <Link href="/checkout" className="btn btn-soft btn-sm">
        <Icon name="sparkles" size={11} />{t(locale, "billing.upgrade")}
      </Link>
    </div>
  );
}
