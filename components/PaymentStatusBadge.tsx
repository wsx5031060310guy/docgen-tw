"use client";
import { Icon } from "./Icon";

export function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: string; label: string; spin?: boolean }> = {
    PAID:    { cls: "chip-good", icon: "check",  label: "PAID 已付款" },
    PENDING: { cls: "chip-warn", icon: "loader", label: "PENDING 處理中", spin: true },
    FAILED:  { cls: "chip-bad",  icon: "x",      label: "FAILED 失敗" },
  };
  const m = map[status?.toUpperCase()] || map.PENDING;
  return (
    <span className={`chip ${m.cls}`} style={{ fontSize: 12, padding: "4px 10px" }}>
      <Icon name={m.icon} size={12} className={m.spin ? "spin" : ""} />
      {m.label}
    </span>
  );
}
