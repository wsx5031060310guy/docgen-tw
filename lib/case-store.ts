// Case + Milestone helpers. Thin wrapper around Prisma so route handlers stay slim.
import { prisma } from "@/lib/prisma";

export type MilestoneKind = "PAYMENT" | "DELIVERY" | "RENEWAL" | "CUSTOM";
export type MilestoneStatus = "PENDING" | "DONE" | "OVERDUE" | "CANCELLED";
export type CaseStatus = "OPEN" | "CLOSED" | "ARCHIVED";

export async function createCase(input: {
  title: string;
  clientName?: string;
  counterparty?: string;
  notes?: string;
  ownerEmail?: string;
  uid: string;
}) {
  return prisma.case.create({ data: input });
}

export async function listCases(filter: { uid: string; status?: CaseStatus }) {
  return prisma.case.findMany({
    where: { uid: filter.uid, ...(filter.status ? { status: filter.status } : {}) },
    include: {
      contracts: { select: { id: true, templateId: true, signingStatus: true, expiryDate: true } },
      attachments: { select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCase(id: string, uid: string) {
  return prisma.case.findUnique({
    where: { id },
    include: {
      contracts: {
        where: { uid },
        omit: { signingToken: true },
        include: { milestones: { orderBy: { dueDate: "asc" } } },
        orderBy: { createdAt: "desc" },
      },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function addAttachment(input: {
  caseId: string;
  filename: string;
  blobUrl: string;
  mimeType?: string;
  sizeBytes?: number;
}) {
  return prisma.caseAttachment.create({ data: input });
}

export async function attachContractToCase(contractId: string, caseId: string) {
  return prisma.contract.update({
    where: { id: contractId },
    data: { caseId },
    select: { id: true, caseId: true },
  });
}

export async function createMilestone(input: {
  contractId: string;
  kind: MilestoneKind;
  title: string;
  amount?: number;
  dueDate: Date;
  note?: string;
}) {
  return prisma.milestone.create({ data: input });
}

export async function updateMilestoneStatus(id: string, status: MilestoneStatus) {
  return prisma.milestone.update({
    where: { id },
    data: {
      status,
      doneAt: status === "DONE" ? new Date() : null,
    },
  });
}

export async function listMilestonesNeedingReminder(now = new Date()) {
  // Pull anything within D-7 .. D+1 window and let the cron handler decide which bucket.
  const start = new Date(now);
  start.setDate(start.getDate() - 2);
  const end = new Date(now);
  end.setDate(end.getDate() + 8);
  return prisma.milestone.findMany({
    where: {
      status: { in: ["PENDING", "OVERDUE"] },
      dueDate: { gte: start, lte: end },
    },
    include: {
      contract: {
        select: {
          id: true,
          recipientEmail: true,
          recipientName: true,
          signingToken: true,
          values: true,
          templateId: true,
          uid: true,
        },
      },
    },
  });
}

export async function markOverdue(now = new Date()) {
  return prisma.milestone.updateMany({
    where: { status: "PENDING", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });
}
