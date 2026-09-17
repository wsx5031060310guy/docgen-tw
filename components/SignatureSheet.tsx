"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

type Point = { x: number; y: number };

export type SignatureCanvasHandle = {
  clear: () => void;
};

const FOCUSABLE_SELECTOR = [
  "button:not(:disabled)",
  "[href]",
  "input:not(:disabled)",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function useSignatureCanvas({
  value,
  onChange,
  height,
  dark,
  fullScreen,
}: {
  value: string;
  onChange: (data: string) => void;
  height?: number;
  dark: boolean;
  fullScreen: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const pointRef = useRef<Point | null>(null);
  const midpointRef = useRef<Point | null>(null);
  const dataRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const restoreVersionRef = useRef(0);
  const emptyRef = useRef(!value);
  const [empty, setEmpty] = useState(!value);

  const updateEmpty = useCallback((nextEmpty: boolean) => {
    emptyRef.current = nextEmpty;
    setEmpty(nextEmpty);
  }, []);

  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const restore = useCallback((data: string, version: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const image = new Image();
    image.onload = () => {
      if (version !== restoreVersionRef.current || !canvasRef.current) return;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      updateEmpty(false);
    };
    image.src = data;
  }, [updateEmpty]);

  const setup = useCallback((dataToRestore = dataRef.current) => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, height ?? rect.height);
    const version = ++restoreVersionRef.current;

    canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(cssHeight * dpr));
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const context = canvas.getContext("2d");
    if (!context) return;
    const responsiveWidth = Math.min(2.8, Math.max(2.2, cssWidth / 180));
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = dark ? "#e8eaf2" : "#1E2A5E";
    context.lineWidth = (fullScreen ? 3 : responsiveWidth) * dpr;

    updateEmpty(!dataToRestore);
    if (dataToRestore) restore(dataToRestore, version);
  }, [dark, fullScreen, height, restore, updateEmpty]);

  useLayoutEffect(() => {
    setup();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;

    let lastWidth = wrap.getBoundingClientRect().width;
    let lastHeight = height ?? wrap.getBoundingClientRect().height;
    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      const rect = wrap.getBoundingClientRect();
      const nextHeight = height ?? rect.height;
      if (Math.abs(rect.width - lastWidth) < 1 && Math.abs(nextHeight - lastHeight) < 1) return;

      lastWidth = rect.width;
      lastHeight = nextHeight;
      const currentData = !emptyRef.current && canvas?.width && canvas.height
        ? canvas.toDataURL("image/png")
        : dataRef.current;
      dataRef.current = currentData;
      setup(currentData);
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [height, setup]);

  useLayoutEffect(() => {
    if (value === dataRef.current) return;
    dataRef.current = value;
    setup(value);
  }, [setup, value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const preventTouchDefault = (event: TouchEvent) => event.preventDefault();
    canvas.addEventListener("touchstart", preventTouchDefault, { passive: false });
    canvas.addEventListener("touchmove", preventTouchDefault, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", preventTouchDefault);
      canvas.removeEventListener("touchmove", preventTouchDefault);
    };
  }, []);

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / Math.max(1, rect.width)),
      y: (event.clientY - rect.top) * (canvas.height / Math.max(1, rect.height)),
    };
  };

  const drawDot = (point: Point) => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + 0.01, point.y + 0.01);
    context.stroke();
  };

  const drawTo = (point: Point) => {
    const context = canvasRef.current?.getContext("2d");
    const previous = pointRef.current;
    if (!context || !previous) return;
    const midpoint = {
      x: (previous.x + point.x) / 2,
      y: (previous.y + point.y) / 2,
    };
    context.beginPath();
    context.moveTo(midpointRef.current?.x ?? previous.x, midpointRef.current?.y ?? previous.y);
    context.quadraticCurveTo(previous.x, previous.y, midpoint.x, midpoint.y);
    context.stroke();
    midpointRef.current = midpoint;
    pointRef.current = point;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    restoreVersionRef.current += 1;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = pointFromEvent(event);
    drawingRef.current = true;
    pointRef.current = point;
    midpointRef.current = point;
    drawDot(point);
    updateEmpty(false);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    drawTo(pointFromEvent(event));
  };

  const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    drawTo(pointFromEvent(event));
    drawingRef.current = false;
    pointRef.current = null;
    midpointRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    const data = canvasRef.current?.toDataURL("image/png") ?? "";
    dataRef.current = data;
    onChangeRef.current(data);
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    restoreVersionRef.current += 1;
    drawingRef.current = false;
    pointRef.current = null;
    midpointRef.current = null;
    dataRef.current = "";
    updateEmpty(true);
    onChangeRef.current("");
  }, [updateEmpty]);

  return {
    canvasRef,
    wrapRef,
    empty,
    clear,
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishStroke,
      onPointerCancel: finishStroke,
    },
  };
}

export const SignatureCanvas = forwardRef<SignatureCanvasHandle, {
  value?: string;
  onChange?: (data: string) => void;
  height?: number;
  dark?: boolean;
  fullScreen?: boolean;
  label: string;
  labelledBy: string;
  describedBy: string;
  showGuide?: boolean;
}>(function SignatureCanvas({
  value = "",
  onChange = () => undefined,
  height,
  dark = false,
  fullScreen = false,
  label,
  labelledBy,
  describedBy,
  showGuide = false,
}, ref) {
  const { canvasRef, wrapRef, empty, clear, pointerHandlers } = useSignatureCanvas({
    value,
    onChange,
    height,
    dark,
    fullScreen,
  });

  useImperativeHandle(ref, () => ({ clear }), [clear]);

  return (
    <div
      ref={wrapRef}
      className={`signature-pad-surface dg-signature-surface ${dark ? "dg-signature-surface--dark" : ""} ${fullScreen ? "dg-sigsheet-canvas-wrap" : ""}`.trim()}
    >
      {empty && !fullScreen && (
        <div
          className={`signature-pad-placeholder ${dark ? "signature-pad-placeholder--dark" : ""}`.trim()}
          aria-hidden="true"
        >
          {label}
        </div>
      )}
      {showGuide && (
        <div className="dg-sigsheet-guide" aria-hidden="true">
          <span className="dg-sigsheet-corner dg-sigsheet-corner--tl" />
          <span className="dg-sigsheet-corner dg-sigsheet-corner--tr" />
          <span className="dg-sigsheet-corner dg-sigsheet-corner--bl" />
          <span className="dg-sigsheet-corner dg-sigsheet-corner--br" />
          <span className="dg-sigsheet-baseline" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="dg-signature-canvas"
        aria-label={`${label}畫布`}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        {...pointerHandlers}
      />
    </div>
  );
});

export function SignatureSheet({
  value,
  label,
  onCancel,
  onConfirm,
}: {
  value: string;
  label: string;
  onCancel: () => void;
  onConfirm: (data: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [showPortraitHint, setShowPortraitHint] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const canvasApiRef = useRef<SignatureCanvasHandle>(null);
  const titleId = useId();
  const descriptionId = useId();
  const orientationHintId = useId();

  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const previousTop = body.style.top;
    body.style.top = `-${scrollY}px`;
    body.classList.add("dg-sigsheet-open");
    const frame = window.requestAnimationFrame(() => cancelRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(frame);
      body.classList.remove("dg-sigsheet-open");
      body.style.top = previousTop;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    const portraitQuery = window.matchMedia("(orientation: portrait)");
    const updateHint = () => setShowPortraitHint(portraitQuery.matches && window.innerWidth < 480);
    updateHint();
    portraitQuery.addEventListener("change", updateHint);
    window.addEventListener("resize", updateHint);
    return () => {
      portraitQuery.removeEventListener("change", updateHint);
      window.removeEventListener("resize", updateHint);
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
    ).filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
    if (focusable.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      ref={dialogRef}
      className="dg-sigsheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={`${descriptionId}${showPortraitHint ? ` ${orientationHintId}` : ""}`}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <header className="dg-sigsheet-header">
        <div className="dg-sigsheet-heading">
          <h2 id={titleId}>親筆簽名</h2>
          <p id={descriptionId}>用手指在框內簽名；建議將手機橫放，字會比較好寫</p>
          {showPortraitHint && (
            <p id={orientationHintId} className="dg-sigsheet-orientation-hint">
              橫放手機可獲得更大簽名區
            </p>
          )}
        </div>
        <button ref={cancelRef} type="button" className="btn btn-ghost dg-sigsheet-cancel" onClick={onCancel}>
          取消
        </button>
      </header>

      <div className="dg-sigsheet-main">
        <SignatureCanvas
          ref={canvasApiRef}
          value={draft}
          onChange={setDraft}
          fullScreen
          showGuide
          label={label}
          labelledBy={titleId}
          describedBy={descriptionId}
        />
      </div>

      <footer className="dg-sigsheet-footer">
        <button
          type="button"
          className="btn btn-ghost btn-lg"
          onClick={() => canvasApiRef.current?.clear()}
          disabled={!draft}
        >
          <Icon name="rotateCcw" size={15} />清除
        </button>
        <button
          type="button"
          className="btn btn-stamp btn-lg dg-sigsheet-confirm"
          onClick={() => onConfirm(draft)}
          disabled={!draft}
        >
          <Icon name="check" size={16} />確定使用這個簽名
        </button>
      </footer>
    </div>,
    document.body,
  );
}
