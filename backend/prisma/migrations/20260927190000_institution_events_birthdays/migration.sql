ALTER TABLE "students" ADD COLUMN "dateOfBirth" TIMESTAMP(3);

ALTER TABLE "student_privacy" ADD COLUMN "showBirthday" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "institution_events" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "eventDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "location" TEXT,
  "category" TEXT NOT NULL DEFAULT 'GENERAL',
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "institution_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "institution_events_institutionId_eventDate_idx" ON "institution_events"("institutionId", "eventDate");
CREATE INDEX "institution_events_institutionId_isPublished_idx" ON "institution_events"("institutionId", "isPublished");

ALTER TABLE "institution_events" ADD CONSTRAINT "institution_events_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "institution_events" ADD CONSTRAINT "institution_events_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
