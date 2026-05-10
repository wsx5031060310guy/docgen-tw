"use client";
import React from "react";
import { Icon } from "./Icon";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={`stepper-item ${i === current ? "active" : i < current ? "done" : ""}`}>
            <span className="stepper-dot">{i < current ? <Icon name="check" size={12} /> : i + 1}</span>
            <span>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="stepper-line" style={i < current ? { background: "var(--primary)" } : {}} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
