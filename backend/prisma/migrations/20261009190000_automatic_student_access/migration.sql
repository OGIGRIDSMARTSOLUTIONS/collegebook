ALTER TABLE "institutions" ADD COLUMN "autoSuspendOnWithdrawal" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN "autoSuspendOnExpiry" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN "accessGraceDays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "students" ADD COLUMN "registryApproved" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN "accessExpiresAt" TIMESTAMP(3);
CREATE TABLE "student_access_events" (
 "id" TEXT NOT NULL, "institutionId" TEXT NOT NULL, "studentId" TEXT NOT NULL,
 "actorUserId" TEXT, "action" TEXT NOT NULL, "reason" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "student_access_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "student_access_events_institutionId_createdAt_idx" ON "student_access_events"("institutionId", "createdAt");
ALTER TABLE "student_access_events" ADD CONSTRAINT "student_access_events_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
