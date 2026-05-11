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

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => (r.ok ? r.json() : null))
      .then(setS)
      .catch(() => undefined);
  }, []);

  if (!s) return null;

  if (s.plan === "PRO") {
    const ends = s.periodEnd ? new Date(s.periodEnd).toLocaleDateString("zh-Hant") : "—";
    return (
      <div className="card" style={{
        padding: compact ? "8px 12px" : "10px 14px",
        background: "#e8f5ed", border: "1px solid #bfe1c8", color: "#1f5a35",
        borderRadius: "var(--radius)", display: "flex", alignItems: "center", gap: 10,
        fontSize: 13,
      }}>
        <Icon name="shieldCheck" size={14} />
        <span><b>Pro 方案啟用中</b>　無限合約，本期至 {ends}</span>
      </div>
    );
  }

  const used = s.usedThisMonth;
  const rem = s.remaining === "unlimited" ? "∞" : s.remaining;
  const exceeded = s.quotaExceeded;
  return (
    <div className="card" style={{
      padding: compact ? "8px 12px" : "12px 14px",
      background: exceeded ? "#fde9e9" : "var(--bg-elev)",
      border: `1px solid ${exceeded ? "#f1b5b5" : "var(--line)"}`,
      color: exceeded ? "#7a1f1f" : "var(--ink)",
      borderRadius: "var(--radius)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, flexWrap: "wrap", fontSize: 13,
    }}>
      <div className="row gap-2" style={{ alignItems: "center" }}>
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
