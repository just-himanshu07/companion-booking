-- CreateEnum
CREATE TYPE "AvailabilityRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COUNTER_PROPOSED', 'EXPIRED', 'CANCELLED', 'BOOKED');

-- DropIndex
DROP INDEX IF EXISTS "AuditLog_adminId_idx";

-- CreateTable
CREATE TABLE "AvailabilityRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "requestedDate" TEXT NOT NULL,
    "requestedStartTime" TEXT NOT NULL,
    "requestedDuration" DOUBLE PRECISION NOT NULL,
    "experienceType" TEXT NOT NULL,
    "generalArea" TEXT,
    "customerMessage" TEXT,
    "counterDate" TEXT,
    "counterStartTime" TEXT,
    "counterDuration" DOUBLE PRECISION,
    "companionMessage" TEXT,
    "status" "AvailabilityRequestStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityRequest_bookingId_key" ON "AvailabilityRequest"("bookingId");

-- CreateIndex
CREATE INDEX "AvailabilityRequest_customerId_idx" ON "AvailabilityRequest"("customerId");

-- CreateIndex
CREATE INDEX "AvailabilityRequest_companionId_idx" ON "AvailabilityRequest"("companionId");

-- CreateIndex
CREATE INDEX "AvailabilityRequest_status_idx" ON "AvailabilityRequest"("status");

-- CreateIndex
CREATE INDEX "AvailabilityRequest_createdAt_idx" ON "AvailabilityRequest"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_createdAt_idx" ON "AuditLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE INDEX "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CompanionProfile_createdAt_idx" ON "CompanionProfile"("createdAt");

-- CreateIndex
CREATE INDEX "CompanionProfile_verificationStatus_createdAt_idx" ON "CompanionProfile"("verificationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_paymentType_status_createdAt_idx" ON "Payment"("paymentType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_accountStatus_createdAt_idx" ON "User"("accountStatus", "createdAt");

-- CreateIndex
CREATE INDEX "User_role_createdAt_idx" ON "User"("role", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationDocument_companionId_idx" ON "VerificationDocument"("companionId");

-- CreateIndex
CREATE INDEX "VerificationDocument_status_idx" ON "VerificationDocument"("status");

-- CreateIndex
CREATE INDEX "VerificationDocument_createdAt_idx" ON "VerificationDocument"("createdAt");

-- AddForeignKey
ALTER TABLE "AvailabilityRequest" ADD CONSTRAINT "AvailabilityRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRequest" ADD CONSTRAINT "AvailabilityRequest_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "CompanionProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRequest" ADD CONSTRAINT "AvailabilityRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

