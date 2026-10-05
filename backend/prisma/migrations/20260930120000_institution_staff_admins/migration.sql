CREATE TABLE "institution_staff" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "institution_staff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "institution_staff_userId_key" ON "institution_staff"("userId");
CREATE INDEX "institution_staff_institutionId_idx" ON "institution_staff"("institutionId");

ALTER TABLE "institution_staff" ADD CONSTRAINT "institution_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "institution_staff" ADD CONSTRAINT "institution_staff_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve institution ownership for existing seeded institution staff.
INSERT INTO "institution_staff" ("id", "userId", "institutionId", "firstName", "lastName", "createdAt", "updatedAt")
SELECT 'STAFF_' || s."id", u."id", s."institutionId", COALESCE(s."firstName", 'Institution'), COALESCE(s."lastName", 'Admin'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u
JOIN "students" s ON s."userId" = u."id"
WHERE u."role" IN ('INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR', 'YEARBOOK_ADMIN')
  AND NOT EXISTS (SELECT 1 FROM "institution_staff" st WHERE st."userId" = u."id");
