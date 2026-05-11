// Parse payment_terms text into draft Milestones.
//
// Goal: best-effort split of common Taiwan freelance payment patterns into
// concrete milestones with relative due dates. NOT a full grammar — we look
// for percentages anchored to common phases (簽約 / 開工 / 期中 / 完工 / 驗收 /
// 月底 / 每月) and synthesize amounts + dates.
//
// Output dates are relative to a baseline (sign date or now); deadline value
// is also consumed when present as the final delivery anchor.

export interface ParsedMilestone {
  kind: "PAYMENT" | "DELIVERY" | "RENEWAL" | "CUSTOM";
  title: string;
  amount?: number;
  dueDate: Date;
  note?: string;
}

interface ParseInput {
  paymentTerms?: string;
  totalAmount?: number;
  signDate?: Date;
  deadlineDate?: Date;
}

const PHASE_OFFSETS: { keys: RegExp; offsetDays: number; titleZh: string; anchor: "sign" | "deadline" }[] = [
  { keys: /簽約|簽訂|首期|頭期/, offsetDays: 0, titleZh: "簽約款", anchor: "sign" },
  { keys: /開工|啟動|動工/, offsetDays: 3, titleZh: "開工款", anchor: "sign" },
  { keys: /期中|中期|二期|二款/, offsetDays: 14, titleZh: "期中款", anchor: "sign" },
  { keys: /完工|驗收|交件|交付|尾款|結案/, offsetDays: 0, titleZh: "尾款", anchor: "deadline" },
];

const PERCENT_REGEX = /(\d{1,3})\s*%/g;

function safeDate(d?: Date): Date {
  if (d && !Number.isNaN(d.getTime())) return new Date(d);
  return new Date();
}

function parseDateLoose(raw?: string): Date | undefined {
  if (!raw) return undefined;
  // Try explicit YYYY/MM/DD or 民國 (e.g., 115/06/30 → 2026/06/30) first —
  // some runtimes (Node 18+) will happily parse "115/01/01" as year 115 AD
  // via the Date constructor, which is never what we want here.
  const m = raw.match(/(\d{2,4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (m) {
    let y = Number(m[1]);
    if (y < 1900) y += 1911; // 民國 → 西元
    const d = new Date(y, Number(m[2]) - 1, Number(m[3]));
    if (!Number.isNaN(d.getTime())) return d;
  }
  const iso = new Date(raw);
  if (!Number.isNaN(iso.getTime()) && iso.getFullYear() >= 1900) return iso;
  return undefined;
}

export function parsePaymentTermsToMilestones(input: ParseInput): ParsedMilestone[] {
  const text = (input.paymentTerms || "").trim();
  const signDate = safeDate(input.signDate);
  const deadlineDate = input.deadlineDate;
  const total = input.totalAmount;

  if (!text) {
    // No payment_terms — fall back to a single milestone on deadline / +30d
    const due = deadlineDate ?? new Date(signDate.getTime() + 30 * 86400000);
    return [
      {
        kind: "PAYMENT",
        title: "報酬款",
        amount: total,
        dueDate: due,
        note: "未指定分期方式，預設為交付日全額給付",
      },
    ];
  }

  // Find every "<phase> ... NN%" pairing.
  const milestones: ParsedMilestone[] = [];
  const phasesHit = new Set<number>();

  // Split text into segments by common separators to localize phase + percent.
  const segments = text.split(/[，,。\n;；]/).map((s) => s.trim()).filter(Boolean);
  for (const seg of segments) {
    PERCENT_REGEX.lastIndex = 0;
    let pmatch: RegExpExecArray | null;
    const percentsInSeg: number[] = [];
    while ((pmatch = PERCENT_REGEX.exec(seg)) !== null) {
      percentsInSeg.push(Number(pmatch[1]));
    }
    if (percentsInSeg.length === 0) continue;
    const pct = percentsInSeg[0];

    // Find a matching phase keyword in this segment
    let phaseIdx = PHASE_OFFSETS.findIndex((p) => p.keys.test(seg));
    if (phaseIdx === -1) {
      // Fallback: assign to first unused phase, else 'CUSTOM'
      phaseIdx = PHASE_OFFSETS.findIndex((_, i) => !phasesHit.has(i));
      if (phaseIdx === -1) phaseIdx = PHASE_OFFSETS.length - 1;
    }
    phasesHit.add(phaseIdx);
    const phase = PHASE_OFFSETS[phaseIdx];
    const anchor = phase.anchor === "deadline" && deadlineDate ? deadlineDate : signDate;
    const due = new Date(anchor.getTime() + phase.offsetDays * 86400000);
    const amount = total != null ? Math.round((total * pct) / 100) : undefined;
    milestones.push({
      kind: "PAYMENT",
      title: `${phase.titleZh} ${pct}%`,
      amount,
      dueDate: due,
      note: seg.length > 80 ? seg.slice(0, 80) + "…" : seg,
    });
  }

  // If we found percents at all, return them sorted by date.
  if (milestones.length > 0) {
    return milestones.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  // No percents — single milestone on deadline.
  const due = deadlineDate ?? new Date(signDate.getTime() + 30 * 86400000);
  return [
    {
      kind: "PAYMENT",
      title: "報酬款",
      amount: total,
      dueDate: due,
      note: text.length > 80 ? text.slice(0, 80) + "…" : text,
    },
  ];
}

// Helper for callers that have raw `values: Record<string,string>` to extract
// the standard freelance/employ/loan inputs.
export function parseMilestonesFromValues(
  values: Record<string, string>,
): ParsedMilestone[] {
  const totalAmount =
    Number(values.amount || values.price || values.fee || values.salary || values.rent) || undefined;
  return parsePaymentTermsToMilestones({
    paymentTerms: values.payment_terms,
    totalAmount,
    signDate: parseDateLoose(values.sign_date) ?? new Date(),
    deadlineDate: parseDateLoose(values.deadline || values.repay_day || values.start_date),
  });
}
