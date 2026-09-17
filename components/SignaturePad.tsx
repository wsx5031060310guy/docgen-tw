"use client";

import { useId, useRef, useState } from "react";
import { Icon } from "./Icon";
import {
  SignatureCanvas,
  SignatureSheet,
  type SignatureCanvasHandle,
} from "./SignatureSheet";

export function SignaturePad({
  value = "",
  onChange,
  label = "在此簽名",
  description = "滑鼠或觸控均可簽署 · IP 與時間戳將自動留存",
  height = 140,
  dark = false,
}: {
  value?: string;
  onChange?: (data: string) => void;
  label?: string;
  description?: string;
  height?: number;
  dark?: boolean;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const canvasApiRef = useRef<SignatureCanvasHandle>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const canvasId = `${id}-canvas`;
  const inlineHeight = Math.min(140, Math.max(120, height));

  const closeSheet = () => {
    setSheetOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const confirmSheet = (data: string) => {
    onChange?.(data);
    closeSheet();
  };

  return (
    <div className="field dg-signature-field" role="group" aria-labelledby={labelId} aria-describedby={descriptionId}>
      <div className="dg-signature-header">
        <span className="field-label" id={labelId}>
          {label} <span className="field-required" aria-hidden="true">*</span>
          <span className="dg-visually-hidden">必填</span>
        </span>
        <button
          className="btn btn-soft btn-sm dg-signature-desktop"
          onClick={() => canvasApiRef.current?.clear()}
          type="button"
          aria-controls={canvasId}
          aria-label={`清除${label}`}
        >
          <Icon name="rotateCcw" size={12} />清除
        </button>
      </div>

      <div className="dg-signature-desktop" id={canvasId}>
        <SignatureCanvas
          ref={canvasApiRef}
          value={value}
          onChange={(data) => onChange?.(data)}
          height={inlineHeight}
          dark={dark}
          label={label}
          labelledBy={labelId}
          describedBy={descriptionId}
        />
      </div>

      <button
        ref={triggerRef}
        type="button"
        className={`dg-signature-mobile dg-signature-trigger ${value ? "dg-signature-trigger--signed" : ""} ${dark ? "dg-signature-trigger--dark" : ""}`.trim()}
        aria-haspopup="dialog"
        onClick={() => setSheetOpen(true)}
      >
        {value ? (
          <>
            {/* A data URL is the signature source; a plain img preserves the requested preview semantics. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="你的簽名" />
            <span className="dg-signature-trigger-action">
              <Icon name="pen" size={17} />重新簽名
            </span>
          </>
        ) : (
          <span className="dg-signature-trigger-empty">
            <Icon name="pen" size={24} />
            <span>點此開始簽名</span>
          </span>
        )}
      </button>

      <div className="field-help dg-signature-hint" id={descriptionId}>{description}</div>

      {sheetOpen && (
        <SignatureSheet
          value={value}
          label={label}
          onCancel={closeSheet}
          onConfirm={confirmSheet}
        />
      )}
    </div>
  );
}
