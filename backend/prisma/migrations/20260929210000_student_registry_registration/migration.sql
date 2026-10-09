-- Student registry records may exist before a student creates a CollegeBook account.
-- Existing users are preserved; only the FK becomes nullable.
ALTER TABLE "students" ALTER COLUMN "userId" DROP NOT NULL;
