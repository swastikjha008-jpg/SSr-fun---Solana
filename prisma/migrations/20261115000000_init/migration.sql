-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('CRYPTO', 'TOKENIZED_STOCK', 'ETF', 'OTHER');

-- CreateEnum
CREATE TYPE "DataProvenance" AS ENUM ('ILLUSTRATIVE', 'OWNER_ENTERED', 'VERIFIED_EXTERNAL');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('UX_OBSERVATION', 'BUG_REPORT', 'FEATURE_REQUEST', 'IMPROVEMENT_SUGGESTION');

-- CreateEnum
CREATE TYPE "FeedbackPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('OBSERVED', 'DOCUMENTED', 'SUBMITTED_EXTERNALLY', 'RESOLVED');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "key" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ReserveProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "reserveUrl" TEXT,
    "walletAddress" TEXT,
    "network" TEXT NOT NULL DEFAULT 'solana-mainnet',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReserveProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioAsset" (
    "id" TEXT NOT NULL,
    "reserveId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "allocationBps" INTEGER NOT NULL,
    "dataProvenance" "DataProvenance" NOT NULL DEFAULT 'OWNER_ENTERED',
    "sourceUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PortfolioAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentThesis" (
    "id" TEXT NOT NULL,
    "reserveId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "philosophy" TEXT NOT NULL,
    "investmentRationale" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "riskDisclosure" TEXT NOT NULL,
    "xPostUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentThesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaFeedback" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "priority" "FeedbackPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "FeedbackStatus" NOT NULL DEFAULT 'OBSERVED',
    "reproductionSteps" TEXT,
    "evidenceUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "externalSubmittedAt" TIMESTAMP(3),
    "externalReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetaFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignChecklist" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "walletAddress" TEXT,
    "xHandle" TEXT,
    "campaignSignupConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "reserveOrTradeCompleted" BOOLEAN NOT NULL DEFAULT false,
    "officialXFollowConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "investmentPostUrl" TEXT,
    "feedbackSubmissionConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "earnSubmissionConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_adminUserId_idx" ON "AdminSession"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReserveProfile_slug_key" ON "ReserveProfile"("slug");

-- CreateIndex
CREATE INDEX "ReserveProfile_publicationStatus_createdAt_idx" ON "ReserveProfile"("publicationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "PortfolioAsset_reserveId_sortOrder_idx" ON "PortfolioAsset"("reserveId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioAsset_reserveId_symbol_key" ON "PortfolioAsset"("reserveId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentThesis_reserveId_key" ON "InvestmentThesis"("reserveId");

-- CreateIndex
CREATE INDEX "BetaFeedback_status_priority_idx" ON "BetaFeedback"("status", "priority");

-- CreateIndex
CREATE INDEX "BetaFeedback_isPublic_createdAt_idx" ON "BetaFeedback"("isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "BetaFeedback_category_idx" ON "BetaFeedback"("category");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioAsset" ADD CONSTRAINT "PortfolioAsset_reserveId_fkey" FOREIGN KEY ("reserveId") REFERENCES "ReserveProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentThesis" ADD CONSTRAINT "InvestmentThesis_reserveId_fkey" FOREIGN KEY ("reserveId") REFERENCES "ReserveProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Defense in depth: allocation is stored as integer basis points within 0..10000.
ALTER TABLE "PortfolioAsset" ADD CONSTRAINT "PortfolioAsset_allocationBps_range" CHECK ("allocationBps" >= 0 AND "allocationBps" <= 10000);
