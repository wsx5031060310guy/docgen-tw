"use client";
import { Icon } from "./Icon";

export function TrustBar({
  items,
}: {
  items: { icon: string; value: string; label: string }[];
}) {
  return (
    <ul className="dg-trustbar-row">
      {items.map((it, i) => (
        <li key={`${it.value}-${it.label}-${i}`} className="dg-trustbar-item">
          <Icon name={it.icon} size={18} />
          <div className="dg-trustbar-copy">
            <strong className="dg-trustbar-num">{it.value}</strong>
            <span className="dg-trustbar-label">{it.label}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
