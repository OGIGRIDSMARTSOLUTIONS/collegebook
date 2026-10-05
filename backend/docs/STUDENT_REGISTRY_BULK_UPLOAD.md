# CollegeBook Student Registry — Bulk Upload

Admin Student Registry is the institutional source of truth. Admins do not manually verify students.

## Account lifecycle

1. Admin creates/imports the student's institutional record.
2. The record remains unclaimed until the student creates a CollegeBook account.
3. The student must provide a matriculation number and at least one of department or phone.
4. The backend matches the supplied details against the institutional registry.
5. A unique match links the existing Student record to the new User account and automatically sets the student to `VERIFIED`.
6. The student's existing institution, department, academic set and YearBook placement are preserved.

## CSV columns

Required:

```text
Name,Matriculation Number,Department,Phone Number,Academic Set
```

The backend also accepts these alternatives for integration imports:

- `Department ID` instead of `Department`
- `Set ID` instead of `Academic Set`

Example:

```csv
Name,Matriculation Number,Department,Phone Number,Academic Set
John Doe,CSC/2022/001,Computer Science,08012345678,2022/2023
Jane Smith,BIO/2022/002,Biology,08023456789,2022/2023
```

## Endpoint

`POST /api/students/admin/bulk`

Authenticated `INSTITUTION_ADMIN` only.

Multipart field:

`file` — CSV file, maximum 2 MB.

The response reports total rows, successfully created rows and failed rows with row numbers and reasons. A failed row does not stop other valid rows from importing.
