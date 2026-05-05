import templatesData from "@/data/templates/contract_types.json";

export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "checkbox";

export interface ContractField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  default?: string | number | boolean;
  max?: number;
}

export interface ContractTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  legalBasis: string[];
  fields: ContractField[];
  clauses: string[];
}

export interface TemplatesIndex {
  version: string;
  jurisdiction: string;
  lastReviewed: string;
  disclaimer: string;
  templates: ContractTemplate[];
  globalClauses: {
    footer: string;
    auditFields: string[];
  };
}

export const templates = templatesData as TemplatesIndex;

export function getTemplate(id: string): ContractTemplate | undefined {
  return templates.templates.find((t) => t.id === id);
}

export function listTemplates(): ContractTemplate[] {
  return templates.templates;
}

export function renderClauses(template: ContractTemplate, values: Record<string, string | number | boolean>): string[] {
  return template.clauses.map((clause) =>
    clause.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const v = values[key];
      return v === undefined || v === null || v === "" ? `[未填寫:${key}]` : String(v);
    })
  );
}

export function buildContractDocument(templateId: string, values: Record<string, string | number | boolean>) {
  const template = getTemplate(templateId);
  if (!template) throw new Error(`Unknown template: ${templateId}`);
  const clauses = renderClauses(template, values);
  return {
    title: template.title,
    category: template.category,
    legalBasis: template.legalBasis,
    clauses,
    footer: templates.globalClauses.footer,
    disclaimer: templates.disclaimer,
    generatedAt: new Date().toISOString(),
  };
}
