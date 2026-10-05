# CollegeBook Loading System

CollegeBook now uses a reusable loading system for consistent, accessible loading feedback.

## Components
- `Spinner` — compact circular indicator for inline operations.
- `ButtonSpinner` — white spinner for buttons.
- `LoadingState` — inline loading row for lists and panels.
- `PageLoader` — centered loader for route/page-level loading.
- `LoadingOverlay` — overlay for operations that temporarily block a surface.
- `Skeleton` / `CardSkeleton` — reusable content placeholders.

## Design principles
- One visual language across the application.
- Brand-coloured progress indicator on light surfaces.
- White spinner on primary buttons.
- Accessible status messaging with `role="status"` and labels.
- Reduced-motion support.
- Existing page layouts are preserved; this change standardizes loading feedback rather than redesigning screens.

## Button usage
`Button` accepts `loading` and `loadingLabel` props. When `loading` is true, the button is disabled and displays a spinner plus the loading label.

```jsx
<Button loading={saveMutation.isPending} loadingLabel="Saving…">
  Save
</Button>
```
