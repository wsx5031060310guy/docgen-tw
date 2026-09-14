import type { ReactNode } from "react";

export type UIStateStatus = "loading" | "empty" | "error" | "success";

export type UIStateProps = {
  status: UIStateStatus;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

const INDICATORS: Record<UIStateStatus, string> = {
  loading: "…",
  empty: "—",
  error: "!",
  success: "✓",
};

export function UIState({
  status,
  title,
  description,
  actions,
  className = "",
}: UIStateProps) {
  const role = status === "error" ? "alert" : "status";

  return (
    <section
      className={`dg-state dg-state--${status} ${className}`.trim()}
      role={role}
      aria-live={status === "error" ? "assertive" : "polite"}
      aria-busy={status === "loading" || undefined}
      data-state={status}
    >
      <span className="dg-state__indicator" aria-hidden="true">
        {INDICATORS[status]}
      </span>
      <h2 className="dg-state__title">{title}</h2>
      {description && <p className="dg-state__description">{description}</p>}
      {actions && <div className="dg-state__actions">{actions}</div>}
    </section>
  );
}
