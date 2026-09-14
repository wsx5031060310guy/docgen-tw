"use client";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

export function SignaturePad({
  value,
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(!value);
  const restored = useRef(false);
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const canvasId = `${id}-canvas`;

  useLayoutEffect(() => {
    const c = canvasRef.current;
    const wrap = wrapRef.current;
    if (!c || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = height * dpr;
    c.style.width = rect.width + "px";
    c.style.height = height + "px";
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = dark ? "#e8eaf2" : "#1E2A5E";
    ctx.lineWidth = 2.2;
    if (value && !restored.current) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, height);
        setEmpty(false);
      };
      img.src = value;
      restored.current = true;
    }
  }, [height, dark, value]);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const t = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  };
  const down = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
    setEmpty(false);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const data = canvasRef.current!.toDataURL("image/png");
    onChange?.(data);
  };
  const clear = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
    onChange?.("");
  };

  return (
    <div className="field dg-signature-field" role="group" aria-labelledby={labelId} aria-describedby={descriptionId}>
      <div className="dg-signature-header">
        <span className="field-label" id={labelId}>
          {label} <span className="field-required" aria-hidden="true">*</span>
          <span className="dg-visually-hidden">必填</span>
        </span>
        <button className="btn btn-soft btn-sm" onClick={clear} type="button" aria-controls={canvasId} aria-label={`清除${label}`}>
          <Icon name="rotateCcw" size={12} />清除
        </button>
      </div>
      <div
        className={`signature-pad-surface dg-signature-surface ${dark ? "dg-signature-surface--dark" : ""}`.trim()}
        ref={wrapRef}
      >
        {empty && (
          <div
            className={`signature-pad-placeholder ${dark ? "signature-pad-placeholder--dark" : ""}`.trim()}
            aria-hidden="true"
          >
            {label}
          </div>
        )}
        <canvas
          id={canvasId}
          ref={canvasRef}
          aria-labelledby={labelId}
          aria-describedby={descriptionId}
          style={{ display: "block", touchAction: "none", cursor: "crosshair" }}
          onMouseDown={down}
          onMouseMove={move}
          onMouseUp={up}
          onMouseLeave={up}
          onTouchStart={down}
          onTouchMove={move}
          onTouchEnd={up}
        />
      </div>
      <div className="field-help dg-signature-hint" id={descriptionId}>{description}</div>
    </div>
  );
}
