// English explanatory copy for each template's /en/templates/[id] landing page.
// The contract body itself stays in Traditional Chinese (governing-law text);
// this is the SEO-targeted explainer for international audiences searching
// in English for "Taiwan freelance contract", "Taiwan NDA template", etc.

export interface TemplateCopyEn {
  intent: string;
  useCases: string[];
  pitfalls: string[];
  keyClauses: { name: string; why: string; ref: string }[];
  faqs: { q: string; a: string }[];
}

export const TEMPLATE_COPY_EN: Record<string, TemplateCopyEn> = {
  freelance: {
    intent:
      "Independent-contractor / service agreement for Taiwan freelancers, design shops, dev teams, and consultants. Specifies deliverables, fees, IP ownership, and late-delivery penalties under Taiwan Civil Code articles on承攬 (work-for-hire).",
    useCases: [
      "Brand identity / logo / UI design projects",
      "Website or app development engagements",
      "Video shoots, photography, editing",
      "Consulting, marketing outsourcing",
    ],
    pitfalls: [
      "Unspecified IP ownership → client assumes buy-out, contractor assumes license",
      "Penalty > 0.5%/day → court reduces under Civil Code §252",
      "No acceptance deadline → completion / delivery disputes drag on",
      "Verbal scope creep without amendment → no extra fees collectable",
    ],
    keyClauses: [
      { name: "Scope of work", why: "List deliverables, specs, revision rounds — avoid endless rework.", ref: "Civil Code §490" },
      { name: "Fees & payment", why: "Recommended split: 30% on signing / 30% midway / 40% on acceptance.", ref: "Civil Code §505" },
      { name: "Intellectual property", why: "Pick a/b/shared explicitly; otherwise ambiguity creeps in.", ref: "Copyright Act §12" },
      { name: "Late-delivery penalty", why: "Market norm: 0.1–0.3%/day + total cap at 20% of fee.", ref: "Civil Code §250, §252" },
    ],
    faqs: [
      { q: "Can the entire fee be paid only on completion?", a: "Yes, but if the engagement runs more than a month, staged payments protect the contractor. For the client, a final 30–40% holdback to acceptance is reasonable." },
      { q: "What if the client refuses to pay the final invoice?", a: "The signed contract stores timestamp + signature hash + IP, usable as evidence. Standard path: certified letter (we can draft) → payment order (支付命令) → civil suit." },
      { q: "If IP is shared, can both parties use it freely?", a: "Yes, but each party must obtain the other's written consent before licensing to a third party (Civil Code §819)." },
    ],
  },
  nda: {
    intent:
      "Mutual confidentiality agreement before commercial talks, tech evaluation, or due-diligence. Backed by Taiwan Trade Secret Act §2 and Civil Code on damages.",
    useCases: [
      "Pre-license technology discussions",
      "Investor due-diligence",
      "Consultants / outsourced staff accessing internal systems",
      "Joint-venture or M&A pre-talks",
    ],
    pitfalls: [
      "Term = perpetual / unlimited → court often strikes part of it for breaching proportionality",
      "Liquidated damages too high (≥ NT$10M) → court reduces",
      "Missing exceptions (already known / publicly available / required by law) → too broad to enforce",
      "No remedy spelled out (injunction / damages) → hard to claim later",
    ],
    keyClauses: [
      { name: "Definition of confidential info", why: "Limit to material that meets Trade Secret Act §2 requirements.", ref: "Trade Secret Act §2" },
      { name: "Standard of care", why: "Good-steward duty, restricted-purpose use only.", ref: "Civil Code §535" },
      { name: "Term", why: "3–5 years typical; up to 10 for technical know-how.", ref: "Civil Code §247-1" },
      { name: "Damages", why: "Stipulated penalty + actual damages.", ref: "Civil Code §227, §250" },
    ],
    faqs: [
      { q: "Should the NDA be one-way or mutual?", a: "Mutual when both parties disclose; one-way only if disclosure is purely from one side." },
      { q: "Is an employee NDA enforceable after they leave?", a: "Always during employment. Post-employment NDA holds only if it meets Trade Secret Act and is proportional. Post-employment non-compete additionally needs reasonable compensation (Labour Standards Act §9-1)." },
    ],
  },
  loan: {
    intent:
      "Personal or corporate loan agreement under Taiwan law — capped at 16% annual interest (Civil Code §205). Spells out principal, rate, repayment, and default consequences.",
    useCases: [
      "Loans between friends or family (written form recommended)",
      "Shareholder advances to a company",
      "SME short-term working capital",
      "Repayment schedules for advanced expenses",
    ],
    pitfalls: [
      "Rate > 16% annually → unenforceable on the excess (Civil Code §205)",
      "Interest deducted upfront → §206 prohibits this",
      "No repayment date → demand may be made anytime (§478)",
      "Verbal agreement without delivery of funds → loan is not formed (§474)",
    ],
    keyClauses: [
      { name: "Principal and delivery", why: "Loan only forms upon actual delivery of funds, not on signing.", ref: "Civil Code §474" },
      { name: "Interest rate", why: "Cap at 16%/year; list the formula explicitly.", ref: "Civil Code §205, §206" },
      { name: "Repayment plan", why: "Installments, grace period, due dates.", ref: "Civil Code §478" },
      { name: "Default", why: "After N days overdue, full balance falls due; enforcement available.", ref: "Civil Code §250, §253" },
    ],
    faqs: [
      { q: "Do I still need a contract when lending to family?", a: "Strongly recommended. Trust aside, written contracts are your only evidence later. Ours is §205-compliant out of the box." },
      { q: "What if the borrower defaults?", a: "Standard flow: certified letter → payment order (支付命令) → civil litigation → enforcement. Our e-signature + hash + IP audit trail is admissible evidence." },
    ],
  },
  consign: {
    intent:
      "Mandate / agency contract under Taiwan law — entrusting another party to handle specific affairs (registration, asset management, agency).",
    useCases: ["Company registration / tax filing", "Asset / rental income management", "Buy-sell agency", "Sales agency"],
    pitfalls: [
      "Scope not enumerated → mandatary has too much / too little authority",
      "Payment timing missing → disputes at close-out",
      "Materials not returned on termination → fresh dispute",
      "External-action risk not allocated",
    ],
    keyClauses: [
      { name: "Affairs entrusted", why: "Enumerate concretely; avoid vague phrasing.", ref: "Civil Code §528" },
      { name: "Standard of care", why: "Paid mandatary owes good-steward duty (§535).", ref: "Civil Code §535" },
      { name: "Compensation & termination", why: "Either party may terminate anytime; party causing untimely termination owes damages.", ref: "Civil Code §547, §549" },
    ],
    faqs: [
      { q: "What's the difference between mandate (委任) and contract-for-work (承攬)?", a: "Mandate is for handling affairs (focus on process); contract-for-work is for delivering a result (focus on outcome). Picking the wrong one changes the governing rules." },
    ],
  },
  employ: {
    intent:
      "Employment contract under Taiwan Labour Standards Act — wage floor, working-hours cap, paid leave are mandatory.",
    useCases: ["Full-time employees", "Part-time / interns", "Foreign workers", "Probationary employees"],
    pitfalls: [
      "Salary below minimum wage → void as written",
      "Hours > 8/day without overtime clause → violates LSA §32",
      "Post-employment non-compete without compensation → clause invalid (LSA §9-1)",
      "Probation > 3 months → harder to terminate later",
    ],
    keyClauses: [
      { name: "Contract type", why: "Indefinite vs fixed-term have different rules.", ref: "Labour Standards Act §9" },
      { name: "Working hours", why: "8 hours/day, 40 hours/week max.", ref: "LSA §30" },
      { name: "Wages", why: "Not below the published minimum wage.", ref: "LSA §21, §22" },
    ],
    faqs: [
      { q: "Can we add a probation period?", a: "Yes. LSA has no explicit probation rule; recommended max 3 months. Termination during probation still requires LSA §11 grounds." },
    ],
  },
  lease: {
    intent:
      "Residential or commercial lease under Taiwan Civil Code + Land Act — covers rent, deposit, repair allocation, early termination.",
    useCases: ["Residential rentals", "Office / retail space", "Storage facilities", "Short-term lets"],
    pitfalls: [
      "Deposit > 2 months → violates Land Act §99 for residential",
      "Repair allocation undefined → who pays for the broken AC",
      "No early-termination clause → either party walks, damages hard to claim",
      "No move-in photo evidence → deposit-return fights",
    ],
    keyClauses: [
      { name: "Premises", why: "Address, square meterage, fixtures.", ref: "Civil Code §421" },
      { name: "Rent & deposit", why: "Deposit ≤ 2 months, returned without interest on clean handover.", ref: "Civil Code §439, Land Act §99" },
      { name: "Repairs", why: "Landlord-borne by default; tenant cannot refuse repairs.", ref: "Civil Code §429" },
    ],
    faqs: [
      { q: "Can a landlord cut off utilities for unpaid rent?", a: "No (absent specific contract terms and proportionality). It can constitute criminal coercion. Use the proper path: demand → terminate → sue for eviction." },
    ],
  },
  sale: {
    intent:
      "Sale of movable or immovable property — covers subject, price, delivery, warranty against defects.",
    useCases: ["Used cars", "Company asset sales", "Art / antiques", "Electronics"],
    pitfalls: [
      "Defect-discovery window unstated → broader disputes",
      "Inspection method missing → buyer demands full refund",
      "Payment timing undefined → collection risk",
    ],
    keyClauses: [
      { name: "Warranty", why: "Seller warrants no value-impairing defects at risk transfer.", ref: "Civil Code §354" },
      { name: "Delivery", why: "Place, method, shipping cost allocation.", ref: "Civil Code §348" },
    ],
    faqs: [
      { q: "How long does warranty last?", a: "Civil Code §365: buyer must notify within 6 months, capped at 5 years total. Commercial deals often shorten to 30–90 days." },
    ],
  },
  dunning: {
    intent:
      "Dunning / demand notice for an overdue payment (Civil Code §229 delayed-performance). Preserves statutory delayed-payment interest and litigation rights.",
    useCases: [
      "Overdue contractor / freelancer fees",
      "Defaulted loan principal or interest",
      "Unpaid invoices",
      "Long-overdue service fees",
    ],
    pitfalls: [
      "Going straight to litigation without prior demand → procedural disadvantage in some cases",
      "Wrong amount → debtor stalls on 'amount disputed'",
      "Not invoking statutory delayed interest → interest can't be back-dated in later suit",
    ],
    keyClauses: [
      { name: "Facts", why: "Reference original contract, debt origin, amount.", ref: "Civil Code §229" },
      { name: "Statutory delayed interest", why: "5% annual from the day after due date.", ref: "Civil Code §233" },
      { name: "Grace period & next steps", why: "Usually 7–10 days; certified letter follows if ignored.", ref: "Civil Code §250" },
    ],
    faqs: [
      { q: "How is a dunning notice different from a certified letter?", a: "A dunning notice is a commercial demand (still informal). A certified letter (存證信函) is a post-office-stamped, legally-recognised statement-of-intent. Practical sequence: dunning first → certified letter if ignored → litigation." },
    ],
  },
  "cert-mail": {
    intent:
      "Draft of a Taiwan Post Office Certified Letter (存證信函) as a legal statement-of-intent. We produce the PDF draft only — users must take it to a post office for actual registered delivery.",
    useCases: ["Performance demand / payment claim", "Statement-of-intent to terminate", "Termination of lease / mandate", "Cease-and-desist for infringement"],
    pitfalls: [
      "Failure to deliver = no effect (Civil Code §95) → registered double-receipt is critical",
      "Emotional wording can become unfavorable evidence",
      "Wrong terminology (demand vs. request) weakens later claims",
    ],
    keyClauses: [
      { name: "Subject", why: "One sentence summarising the demand.", ref: "Civil Code §94" },
      { name: "Facts / request / deadline", why: "Three-section format: facts → demand → deadline.", ref: "Civil Code §95" },
    ],
    faqs: [
      { q: "What if the recipient doesn't reply?", a: "Statement of intent takes effect upon delivery (§95), regardless of reply. Non-response doesn't impair the effect — escalate to the next step (payment order / litigation)." },
      { q: "Can email replace a certified letter?", a: "Email can deliver intent but proof is weaker (recipient may deny receipt). Post-office certified letter has post-office archive + registered receipt = strongest courtroom evidence." },
    ],
  },
  custom: {
    intent:
      "Blank template — for atypical collaborations. Risk check helps identify common high-risk wording.",
    useCases: ["Cross-discipline non-standard arrangements", "VC investment agreements", "Custom tech licensing", "Artist management"],
    pitfalls: [
      "Clauses copy-pasted from internet → underlying law may not match your case",
      "Missing venue clause → litigation location uncertain",
      "Not excluding unilateral termination → one side can walk after signing",
    ],
    keyClauses: [
      { name: "Parties", why: "Full identifying details.", ref: "Civil Code §153" },
      { name: "Body", why: "Numbered, explicit, enforceable clauses.", ref: "" },
    ],
    faqs: [
      { q: "Does risk check work on the custom template?", a: "Yes. The engine keyword/rule-checks for common high-risk wording (e.g., total-rights waiver, unilateral termination), but custom contracts strongly warrant lawyer review." },
    ],
  },
};
