"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { listTemplates, getTemplate, renderClauses, type ContractField } from "@/lib/contract-engine";
import { SignaturePad } from "@/components/ui/SignaturePad";

type FormValues = Record<string, string | number | boolean>;

export default function NewContractPage() {
  const allTemplates = useMemo(() => listTemplates(), []);
  const [templateId, setTemplateId] = useState<string>(allTemplates[0]?.id ?? "");
  const [values, setValues] = useState<FormValues>({});
  const [partyASignature, setPartyASignature] = useState<string | null>(null);
  const [partyBSignature, setPartyBSignature] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ id?: string; error?: string } | null>(null);

  const template = useMemo(() => getTemplate(templateId), [templateId]);
  const previewClauses = useMemo(() => (template ? renderClauses(template, values) : []), [template, values]);

  const handleFieldChange = (key: string, value: string | number | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    if (!template) return;
    setSubmitted(true);
    if (!partyASignature || !partyBSignature) {
      setSubmitResult({ error: "雙方均需完成簽名" });
      return;
    }
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: template.id,
        values,
        partyASignature,
        partyBSignature,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setSubmitResult({ error: json.error ?? "送出失敗" });
    } else {
      setSubmitResult({ id: json.id });
    }
  };

  if (!template) return <div className="p-8">找不到合約模板</div>;

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-10 space-y-8">
      <header className="space-y-2">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← 回首頁</Link>
        <h1 className="text-3xl font-bold">建立合約</h1>
        <p className="text-sm text-zinc-500">所有模板皆參考中華民國現行法令制定，重大條款仍建議委請執業律師審閱。</p>
      </header>

      <section className="space-y-2">
        <label className="block text-sm font-medium">1. 選擇合約類型</label>
        <select
          value={templateId}
          onChange={(e) => {
            setTemplateId(e.target.value);
            setValues({});
            setSubmitted(false);
            setSubmitResult(null);
          }}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {allTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}（{t.category}）
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500">{template.description}</p>
        <details className="text-xs text-zinc-500">
          <summary className="cursor-pointer">法律依據</summary>
          <ul className="ml-4 list-disc">
            {template.legalBasis.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </details>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. 填寫資訊</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {template.fields.map((field) => (
            <FieldInput key={field.key} field={field} value={values[field.key]} onChange={handleFieldChange} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. 合約預覽</h2>
        <div className="rounded border border-zinc-300 bg-white p-6 text-sm leading-7 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          <div className="text-center text-lg font-bold mb-4">{template.title}</div>
          <ol className="space-y-2">
            {previewClauses.map((clause, i) => (
              <li key={i}>{clause}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. 雙方簽名</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">甲方簽名</h3>
            <SignaturePad onSave={(d) => setPartyASignature(d)} />
            {partyASignature && <p className="text-xs text-green-600">甲方簽名已儲存</p>}
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">乙方簽名</h3>
            <SignaturePad onSave={(d) => setPartyBSignature(d)} />
            {partyBSignature && <p className="text-xs text-green-600">乙方簽名已儲存</p>}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <button
          onClick={submit}
          className="w-full rounded bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          disabled={submitted && !submitResult?.error}
        >
          確認送出並建立合約
        </button>
        {submitResult?.error && <p className="text-sm text-red-600">{submitResult.error}</p>}
        {submitResult?.id && (
          <p className="text-sm text-green-600">合約已建立（ID: {submitResult.id}）。</p>
        )}
      </section>
    </main>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ContractField;
  value: string | number | boolean | undefined;
  onChange: (key: string, value: string | number | boolean) => void;
}) {
  const baseClass = "w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";
  const label = (
    <label className="block text-sm font-medium">
      {field.label}
      {field.required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );

  switch (field.type) {
    case "textarea":
      return (
        <div className="space-y-1 sm:col-span-2">
          {label}
          <textarea
            className={baseClass + " min-h-24"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </div>
      );
    case "select":
      return (
        <div className="space-y-1">
          {label}
          <select
            className={baseClass}
            value={(value as string) ?? (field.default as string) ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
          >
            <option value="">請選擇</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    case "checkbox":
      return (
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(value ?? field.default)}
              onChange={(e) => onChange(field.key, e.target.checked)}
            />
            {field.label}
          </label>
        </div>
      );
    case "number":
      return (
        <div className="space-y-1">
          {label}
          <input
            type="number"
            className={baseClass}
            value={(value as number) ?? ""}
            max={field.max}
            onChange={(e) => onChange(field.key, e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
      );
    case "date":
      return (
        <div className="space-y-1">
          {label}
          <input
            type="date"
            className={baseClass}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </div>
      );
    default:
      return (
        <div className="space-y-1">
          {label}
          <input
            type="text"
            className={baseClass}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </div>
      );
  }
}
