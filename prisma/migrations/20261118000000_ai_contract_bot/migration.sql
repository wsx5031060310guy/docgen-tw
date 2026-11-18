-- AlterTable
ALTER TABLE "BillingProfile"
ADD COLUMN "lineUserId" TEXT,
ADD COLUMN "lineLinkCode" TEXT,
ADD COLUMN "lineLinkCodeExpires" TIMESTAMP(3),
ADD COLUMN "aiDay" TEXT,
ADD COLUMN "aiCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ContractDraft" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "transcript" TEXT,
    "source" TEXT NOT NULL DEFAULT 'line',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "contractId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingProfile_lineUserId_key" ON "BillingProfile"("lineUserId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingProfile_lineLinkCode_key" ON "BillingProfile"("lineLinkCode");

-- CreateIndex
CREATE UNIQUE INDEX "ContractDraft_token_key" ON "ContractDraft"("token");

-- CreateIndex
CREATE INDEX "ContractDraft_uid_idx" ON "ContractDraft"("uid");
