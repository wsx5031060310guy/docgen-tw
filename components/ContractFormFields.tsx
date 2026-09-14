"use client";

import type { ChangeEvent } from "react";
import { Icon } from "./Icon";
import type { Template, Values } from "@/lib/templates";

export type ContractFieldGroups = Record<string, Template["fields"]>;

export function ContractFormFields({
  template,
  groups,
  values,
  errors,
  onChange,
}: {
  template: Template;
  groups: ContractFieldGroups;
  values: Values;
  errors: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
}) {
  return (
    <div className="dg-contract-fields">
      {Object.entries(groups).map(([groupId, fields]) => (
        <fieldset className="dg-newcontract-fieldset dg-contract-field-group" key={groupId}>
          <legend className="dg-contract-field-group__legend">
            {template.groups[groupId] || groupId}
          </legend>
          <div className="dg-fields-2col">
            {fields.map((field) => {
              const inputId = `contract-field-${field.id}`;
              const errorId = `${inputId}-error`;
              const error = errors[field.id];
              const sharedProps = {
                id: inputId,
                value: values[field.id] || "",
                onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                  onChange(field.id, event.target.value),
                "aria-invalid": error ? (true as const) : undefined,
                "aria-describedby": error ? errorId : undefined,
              };

              return (
                <div className={`field${field.span === 2 ? " dg-field-span-2" : ""}`} key={field.id}>
                  <label className="field-label" htmlFor={inputId}>
                    {field.label}
                    {field.required && (
                      <>
                        <span className="field-required" aria-hidden="true">*</span>
                        <span className="dg-visually-hidden">（必填）</span>
                      </>
                    )}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      {...sharedProps}
                      className={`textarea${error ? " error" : ""}`}
                      placeholder={field.placeholder}
                      rows={3}
                    />
                  ) : field.type === "select" ? (
                    <select {...sharedProps} className={`select${error ? " error" : ""}`}>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...sharedProps}
                      className={`input${error ? " error" : ""}`}
                      type={field.type === "number" || field.type === "date" ? field.type : "text"}
                      inputMode={field.type === "number" ? "decimal" : undefined}
                      step={field.type === "number" ? "any" : undefined}
                      placeholder={field.placeholder}
                    />
                  )}
                  {error && (
                    <span className="field-error" id={errorId}>
                      <Icon name="alert" size={11} />{error}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
