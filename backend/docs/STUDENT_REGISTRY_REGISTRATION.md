# CollegeBook Student Registry & Registration

## New identity rule

Student account creation no longer asks for institution, department or academic-set codes.

A student must provide:
- Matriculation number — compulsory
- Department OR phone number — at least one compulsory
- Email and password — account credentials

The institutional Student Registry is the source of truth. The registration service finds the student by matriculation number and accepts the record when the matriculation matches and at least one supplied secondary field (department or phone) matches. If both secondary fields are supplied, the match may be 2/3 or 3/3. Ambiguous matches are rejected rather than guessed.

## Registry lifecycle

1. Institution admin creates a student registry record with name, matriculation number, department, phone and academic set.
2. The record exists without a CollegeBook user account (`Student.userId = null`).
3. The student registers using matriculation + department/phone.
4. CollegeBook claims the existing Student record instead of creating a duplicate.
5. The student becomes VERIFIED/ACTIVE.
6. The latest non-archived YearBook associated with the student's academic set is automatically populated when available.

Existing student accounts remain linked to their existing Student records. Internal `Student.code` values remain for system-level compatibility and are not used as registration credentials or identification codes.
