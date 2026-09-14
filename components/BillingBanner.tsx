"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";

interface Status {
  plan: "FREE" | "PRO";
  periodEnd: string | null;
  usedThisMonth: number;
  remaining: number | "unlimited";
  quotaExceeded: boolean;
  month: string;
}

export function BillingBanner({ compact }: { compact?: boolean }) {
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
        <span>正在載入方案狀態…</span>
      </div>
    );
  }

  if (unavailable || !s) {
    return (
      <div className={`${className} dg-notice--error`} role="alert">
        <div className="dg-billing-banner__message">
          <Icon name="alertOctagon" size={14} />
          <span>暫時無法載入方案狀態，請稍後再試。</span>
        </div>
        <button className="btn btn-ghost btn-sm" type="button" onClick={retry}>
          重新載入
        </button>
      </div>
    );
  }

  if (s.plan === "PRO") {
    const ends = s.periodEnd ? new Date(s.periodEnd).toLocaleDateString("zh-Hant") : "—";
    return (
      <div className={`${className} dg-notice--success`} role="status">
        <Icon name="shieldCheck" size={14} />
        <span><b>Pro 方案啟用中</b>　無限合約，本期至 {ends}</span>
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
          <b>免費方案</b>　本月已用 <b>{used}</b> / 3 份{rem !== "∞" && <>，剩 <b>{rem}</b> 份</>}
        </span>
      </div>
      <Link href="/checkout" className="btn btn-soft btn-sm">
        <Icon name="sparkles" size={11} />升級 Pro
      </Link>
    </div>
  );
}
