-- Student accounts do not expire. Keep registry approval and YearBook data.
ALTER TABLE "institutions" DROP COLUMN IF EXISTS "autoSuspendOnWithdrawal";
ALTER TABLE "institutions" DROP COLUMN IF EXISTS "autoSuspendOnExpiry";
ALTER TABLE "institutions" DROP COLUMN IF EXISTS "accessGraceDays";
ALTER TABLE "students" DROP COLUMN IF EXISTS "accessExpiresAt";
