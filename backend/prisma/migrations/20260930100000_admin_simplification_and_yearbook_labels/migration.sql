-- CollegeBook admin simplification
-- YearBook edition labels are text so one institution can publish multiple
-- editions in the same calendar year (e.g. year 2026, year 2026a, year 2026b).
ALTER TABLE "year_books"
  ALTER COLUMN "year" TYPE TEXT USING "year"::text;

-- Inter-institutional social interaction is disabled at the institution policy level.
ALTER TABLE "institutions"
  ALTER COLUMN "crossInstitutionPolicy" SET DEFAULT 'OFF';
UPDATE "institutions" SET "crossInstitutionPolicy" = 'OFF' WHERE "crossInstitutionPolicy" <> 'OFF';
