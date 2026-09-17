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
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const canvasId = `${id}-canvas`;

  // Size the bitmap to the surface once, and again only when the surface resizes.
  // Assigning canvas.width wipes the bitmap, so this must NOT run when `value`
  // changes: it used to, and every stroke after the first erased the drawing
  // (the parent set `value` on pointer-up, the effect re-ran, the canvas
  // cleared, and the restore branch had already been consumed).
  const setup = () => {
    const c = canvasRef.current;
    const wrap = wrapRef.current;
    if (!c || !wrap) return null;
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    c.width = Math.max(1, Math.round(rect.width * dpr));
    c.height = Math.max(1, Math.round(height * dpr));
    c.style.width = rect.width + "px";
    c.style.height = height + "px";
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = dark ? "#e8eaf2" : "#1E2A5E";
    ctx.lineWidth = 2.2;
    return { ctx, width: rect.width };
  };
  const restore = (data: string) => {
    const c = canvasRef.current;
    if (!c || !data) return;
    const ctx = c.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, c.width / (window.devicePixelRatio || 1), height);
      setEmpty(false);
    };
    img.src = data;
  };
  const latest = useRef(value ?? "");
  useLayoutEffect(() => {
    latest.current = value ?? "";
  }, [value]);

  useLayoutEffect(() => {
    setup();
    if (latest.current) restore(latest.current);
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    let lastWidth = wrap.getBoundingClientRect().width;
    const ro = new ResizeObserver(() => {
      const w = wrap.getBoundingClientRect().width;
      if (Math.abs(w - lastWidth) < 1) return; // mobile URL bar show/hide fires without a width change
      lastWidth = w;
      setup();
      if (latest.current) restore(latest.current);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, dark]);

  // Placeholder shows when nothing is drawn: either the parent holds no value
  // and no stroke has started (tracked in `empty`), or the parent reset it to "".
  const showPlaceholder = empty && !value;

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
    setEmpty(false);
  };
  const move = (e: React.PointerEvent) => {
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
        {showPlaceholder && (
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
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={up}
        />
      </div>
      <div className="field-help dg-signature-hint" id={descriptionId}>{description}</div>
    </div>
  );
}
