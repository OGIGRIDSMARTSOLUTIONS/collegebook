-- YearBook class/year integrity repair (data only, no schema change).
--
-- An earlier version linked YearBooks that had no class to the CURRENT
-- class, so e.g. "year 2025" could be filled from Class of 2026. This
-- repair makes every active YearBook hold only the class of its own year.
-- Archived YearBooks are left exactly as they are.

-- 1. Relink active YearBooks whose label year doesn't match their class.
--    Point them at "Class of <label year>" if it exists and no other
--    YearBook with the same label already uses it; otherwise unlink them
--    (an admin can link them from YearBook Studio).
UPDATE "year_books" yb
SET "setId" = (
  SELECT s2."id"
  FROM "academic_sets" s2
  WHERE s2."institutionId" = yb."institutionId"
    AND s2."departmentId" IS NULL
    AND s2."startYear" = CAST(substring(yb."year" from '(?:19|20)[0-9]{2}') AS INTEGER)
    AND NOT EXISTS (
      SELECT 1 FROM "year_books" o
      WHERE o."institutionId" = yb."institutionId"
        AND o."year" = yb."year"
        AND o."setId" = s2."id"
        AND o."id" <> yb."id"
    )
  ORDER BY s2."createdAt" DESC
  LIMIT 1
)
FROM "academic_sets" s
WHERE s."id" = yb."setId"
  AND yb."status" <> 'ARCHIVED'
  AND substring(yb."year" from '(?:19|20)[0-9]{2}') IS NOT NULL
  AND s."startYear" <> CAST(substring(yb."year" from '(?:19|20)[0-9]{2}') AS INTEGER);

-- 2a. Linked active YearBooks: remove students who aren't in that class.
DELETE FROM "year_book_students" ybs
USING "year_books" yb, "students" st
WHERE ybs."yearBookId" = yb."id"
  AND ybs."studentId" = st."id"
  AND yb."status" <> 'ARCHIVED'
  AND yb."setId" IS NOT NULL
  AND st."setId" <> yb."setId";

-- 2b. Unlinked active YearBooks with a year in the label: remove students
--     whose class is a different year.
DELETE FROM "year_book_students" ybs
USING "year_books" yb, "students" st, "academic_sets" s
WHERE ybs."yearBookId" = yb."id"
  AND ybs."studentId" = st."id"
  AND s."id" = st."setId"
  AND yb."status" <> 'ARCHIVED'
  AND yb."setId" IS NULL
  AND substring(yb."year" from '(?:19|20)[0-9]{2}') IS NOT NULL
  AND s."startYear" <> CAST(substring(yb."year" from '(?:19|20)[0-9]{2}') AS INTEGER);

-- 3. Fill each linked active YearBook with any of its class's students
--    who are missing (e.g. after being relinked in step 1).
INSERT INTO "year_book_students" ("id", "yearBookId", "institutionId", "studentId")
SELECT gen_random_uuid()::text, yb."id", yb."institutionId", st."id"
FROM "year_books" yb
JOIN "students" st
  ON st."setId" = yb."setId"
 AND st."institutionId" = yb."institutionId"
WHERE yb."status" <> 'ARCHIVED'
  AND yb."setId" IS NOT NULL
ON CONFLICT ("yearBookId", "studentId") DO NOTHING;
