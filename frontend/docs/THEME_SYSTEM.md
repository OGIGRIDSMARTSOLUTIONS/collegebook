# CollegeBook Personal Theme System

The frontend now includes a centralized personal colour-theme system.

## What it does

- Adds a **Theme colour** control to the signed-in user's account menu.
- Provides 10 professional themes:
  - CollegeBook
  - Ocean
  - Royal
  - Purple
  - Emerald
  - Rose
  - Amber
  - Slate
  - Sky
  - Forest
- Applies the selected theme through CSS design tokens so shared components respond together.
- Persists the user's selection in `localStorage` under `collegebook-theme`.
- Makes the selected brand colour available across the student, admin and authentication layouts.
- Keeps semantic success, warning and danger colours separate from the personal theme.
- Keeps the YearBook gold identity as a special product accent.
- The login hero background and animated dot-wave colour also respond to the selected theme.

## Architecture

```text
ThemeProvider
    ↓
Selected theme + localStorage
    ↓
CSS runtime variables
    ↓
Tailwind semantic tokens
    ↓
Navbar / Sidebar / Cards / Forms / YearBook / Network / Admin / Auth
```

## Important

This is a frontend-only feature. No backend, database, Prisma schema, API route or authentication logic is required for the personal theme selection.
