"use client";
import { Icon } from "./Icon";
import { LEGAL } from "@/lib/legal";

export function LegalBasisChip({
  code,
  size = "md",
}: {
  code: string;
  size?: "sm" | "md";
}) {
  const meta = LEGAL[code];
  const sz = size === "sm" ? { padding: "2px 7px", fontSize: 11 } : {};
  return (
    <span className="tt-host chip chip-mono" style={sz}>
      <Icon name="scale" size={11} />
      <span>{code}</span>
      {meta && (
        <span className="tt">
          <b style={{ display: "block", marginBottom: 4, fontSize: 12 }}>{meta.title}</b>
          <span style={{ color: "rgba(255,255,255,0.85)" }}>{meta.body}</span>
        </span>
      )}
    </span>
  );
}
