"use client";
import { Icon } from "./Icon";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="stepper" aria-label="流程進度">
      {steps.map((s, i) => (
        <li
          className="stepper-group"
          key={i}
          aria-current={i === current ? "step" : undefined}
        >
          <div className={`stepper-item ${i === current ? "active" : i < current ? "done" : ""}`}>
            <span className="stepper-dot">{i < current ? <Icon name="check" size={12} /> : i + 1}</span>
            <span className="stepper-label">{s}</span>
          </div>
          {i < steps.length - 1 && (
            <span className={`stepper-line ${i < current ? "done" : ""}`} aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  );
}
