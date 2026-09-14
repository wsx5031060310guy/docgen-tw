"use client";
import { useEffect, useId, useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusOpenedRef = useRef(false);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (!hostRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  if (!meta) {
    return (
      <span className="chip chip-mono" style={sz}>
        <Icon name="scale" size={11} />
        <span>{code}</span>
      </span>
    );
  }

  return (
    <span
      ref={hostRef}
      className="tt-host"
      data-open={open || undefined}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setOpen(true); }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse") setOpen(false); }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="chip chip-mono tt-trigger"
        style={sz}
        aria-expanded={open}
        aria-controls={tooltipId}
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => {
          focusOpenedRef.current = true;
          setOpen(true);
          window.requestAnimationFrame(() => { focusOpenedRef.current = false; });
        }}
        onClick={() => {
          if (focusOpenedRef.current) return;
          setOpen((value) => !value);
        }}
      >
        <Icon name="scale" size={11} />
        <span>{code}</span>
      </button>
      <span className="tt" id={tooltipId} role="tooltip">
        <b className="tt-title">{meta.title}</b>
        <span>{meta.body}</span>
        <span className="tt-hint">再次按下或按 Escape 關閉</span>
      </span>
    </span>
  );
}
