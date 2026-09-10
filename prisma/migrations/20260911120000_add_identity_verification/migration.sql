-- AlterEnum: Add new AccountStatus values
ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'PENDING_EMAIL_VERIFICATION';
ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'PENDING_IDENTITY_VERIFICATION';
ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- CreateEnum: KYCStatus
CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum: KYCDocumentType
CREATE TYPE "KYCDocumentType" AS ENUM ('AADHAAR', 'PAN', 'DRIVING_LICENCE', 'PASSPORT', 'VOTER_ID');

-- CreateTable: IdentityVerification
CREATE TABLE "IdentityVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" "KYCDocumentType" NOT NULL,
    "documentFrontUrl" TEXT NOT NULL,
    "documentBackUrl" TEXT,
    "selfieUrl" TEXT NOT NULL,
    "status" "KYCStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityVerification_userId_key" ON "IdentityVerification"("userId");
CREATE INDEX "IdentityVerification_userId_idx" ON "IdentityVerification"("userId");
CREATE INDEX "IdentityVerification_status_idx" ON "IdentityVerification"("status");
CREATE INDEX "IdentityVerification_createdAt_idx" ON "IdentityVerification"("createdAt");

-- AddForeignKey
ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

