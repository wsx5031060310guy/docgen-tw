// Minimal CSV serialiser. Quotes fields containing comma / quote / newline.
// Prepends UTF-8 BOM so Excel opens Chinese correctly.

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return "﻿" + (columns?.join(",") ?? "") + "\n";
  const keys = columns ?? Object.keys(rows[0]);
  const head = keys.join(",");
  const body = rows
    .map((r) => keys.map((k) => csvCell(r[k])).join(","))
    .join("\n");
  return "﻿" + head + "\n" + body + "\n";
}

function csvCell(v: unknown): string {
  if (v == null) return "";
  let s: string;
  if (v instanceof Date) s = v.toISOString();
  else if (typeof v === "object") s = JSON.stringify(v);
  else s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
