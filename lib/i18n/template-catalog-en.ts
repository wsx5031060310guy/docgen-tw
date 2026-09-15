export const TEMPLATE_CATALOG_EN: Record<
  string,
  { name: string; description: string; category: string }
> = {
  freelance: {
    name: "Freelance / Service Agreement",
    description: "For one-off design, development, or copywriting projects: deliverables, milestones, acceptance, warranty, IP.",
    category: "Professional services",
  },
  nda: {
    name: "NDA",
    description: "Mutual confidentiality before collaboration or talks, protecting trade secrets and customer data.",
    category: "Business",
  },
  loan: {
    name: "Loan Agreement",
    description: "Loans between people or companies, covering amount, interest, repayment term, and the Civil Code §205 cap.",
    category: "Finance",
  },
  consign: {
    name: "Mandate (Agency) Agreement",
    description: "Appoint another to handle tasks such as agency or property management, subject to a prudent-manager duty.",
    category: "Agency",
  },
  employ: {
    name: "Employment Contract",
    description: "Employment terms covering wages, hours, and leave under mandatory Labor Standards Act rules.",
    category: "Employment",
  },
  lease: {
    name: "Lease Agreement",
    description: "House or land leases covering rent, deposit, repairs, and early termination.",
    category: "Real estate",
  },
  sale: {
    name: "Sale Agreement",
    description: "Sales of movable or real property, covering the subject, price, delivery, and defect warranty.",
    category: "Trade",
  },
  dunning: {
    name: "Dunning Notice",
    description: "Demand for overdue payment under Civil Code §229, usable as evidence before certified mail or litigation.",
    category: "Collections",
  },
  "cert-mail": {
    name: "Certified-Mail Draft",
    description: "Draft PDF in Taiwan Post's certified-mail format; users must send it by registered mail at a post office.",
    category: "Collections",
  },
  custom: {
    name: "Custom Contract",
    description: "Start from scratch with AI-assisted statute checks for each clause; suited to special or nonstandard deals.",
    category: "Blank",
  },
};
