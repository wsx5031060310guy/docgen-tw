"use client";

import { Icon } from "./Icon";
import { LEGAL } from "@/lib/legal";
import type { Template } from "@/lib/templates";

export function ContractTemplatePicker({
  templates,
  selectedTemplate,
  showLegal,
  onSelect,
  onToggleLegal,
}: {
  templates: Template[];
  selectedTemplate: Template;
  showLegal: boolean;
  onSelect: (templateId: string) => void;
  onToggleLegal: () => void;
}) {
  const legalPanelId = "contract-template-legal-basis";

  return (
    <div className="dg-stack">
      <fieldset className="dg-newcontract-fieldset">
        <legend className="dg-visually-hidden">選擇合約模板</legend>
        <div className="dg-templates-pick">
          {templates.map((template) => {
            const selected = selectedTemplate.id === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelect(template.id)}
                className={`card dg-template-choice${selected ? " dg-card-selected" : ""}`}
                aria-pressed={selected}
              >
                <span className="dg-template-choice__title">
                  <Icon name={template.icon} size={16} />
                  <span>{template.name}</span>
                </span>
                <span className="dg-template-choice__description">{template.description}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <section className="card dg-card-compact dg-template-legal" aria-labelledby="contract-template-legal-title">
        <button
          className="dg-template-legal__toggle"
          type="button"
          onClick={onToggleLegal}
          aria-expanded={showLegal}
          aria-controls={legalPanelId}
        >
          <span className="dg-template-legal__title" id="contract-template-legal-title">
            <Icon name="scale" size={14} />此模板適用之法令依據
          </span>
          <Icon name={showLegal ? "chevronUp" : "chevronDown"} size={14} />
        </button>
        {showLegal && (
          <div className="dg-template-legal__list" id={legalPanelId}>
            {selectedTemplate.legal.map((code) => {
              const legal = LEGAL[code];
              return (
                <div className="dg-template-legal__item" key={code}>
                  <h3 className="dg-template-legal__item-title">{legal?.title || code}</h3>
                  {legal && <p className="dg-template-legal__item-copy">{legal.body}</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
