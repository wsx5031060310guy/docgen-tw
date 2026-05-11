// Tiny per-field diff helper. Compares two flat string maps and returns
// an ordered list of { key, before, after } for keys that changed.
//
// Used to render the contract version diff page without dragging in any
// dependency.

export interface FieldChange {
  key: string;
  before: string;
  after: string;
}

export function diffValues(a: Record<string, string>, b: Record<string, string>): FieldChange[] {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  const out: FieldChange[] = [];
  for (const k of keys) {
    const va = a?.[k] ?? "";
    const vb = b?.[k] ?? "";
    if (va !== vb) out.push({ key: k, before: va, after: vb });
  }
  return out.sort((x, y) => x.key.localeCompare(y.key));
}

/**
 * Naive char-level diff for two short strings. Returns three buckets:
 * `same` head, `before` middle, `after` middle, `same` tail. Good enough
 * for visual highlights in a small table cell.
 */
export function inlineDiff(
  before: string,
  after: string,
): { head: string; before: string; after: string; tail: string } {
  const a = before ?? "";
  const b = after ?? "";
  const minLen = Math.min(a.length, b.length);
  let head = 0;
  while (head < minLen && a[head] === b[head]) head++;
  let tail = 0;
  while (tail < minLen - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;
  return {
    head: a.slice(0, head),
    before: a.slice(head, a.length - tail),
    after: b.slice(head, b.length - tail),
    tail: a.slice(a.length - tail),
  };
}
