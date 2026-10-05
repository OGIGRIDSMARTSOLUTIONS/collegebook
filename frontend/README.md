# CollegeBook — Frontend

React 19 + Vite + Tailwind v4 + TanStack Query + Zustand + React Router 7.

## Getting started

```bash
npm install
cp .env.example .env   # points at the backend, defaults to http://localhost:4000/api
npm run dev             # http://localhost:5173
```

Requires the backend running (`cd ../backend && npm run dev`).

## What's built

- **Auth**: register (with live institution-code lookup against
  `GET /institutions/:code`), login, logout — cookie-based, matching the
  backend's httpOnly JWT design. `src/services/api.js` handles silent
  token refresh via an axios interceptor: a 401 on any non-auth route
  triggers one `/auth/refresh` attempt before surfacing as "logged out."
- **Session state**: `useAuth()` (`src/hooks/useAuth.js`) is the single
  source of truth, backed by `GET /auth/me` and cached via TanStack Query;
  `authStore` (Zustand) just mirrors that for synchronous access
  elsewhere (e.g. `ProtectedRoute`).
- **Feed**: create a post (with visibility selector matching the
  backend's `PostVisibility` enum), list the feed, react with LIKE.
- **Layout**: `MainLayout` (top nav + bottom mobile nav, search bar,
  notification bell) for the authenticated app; `AuthLayout` (split-screen
  with a custom network-graph SVG illustration) for login/register.
- **Design tokens**: Tailwind v4, defined via CSS `@theme` in
  `src/index.css` — deep ivy green as the one brand colour (deliberately
  not a generic SaaS blue), IBM Plex Sans throughout, restrained
  near-white/white/gray scale. Matches the architecture doc's "minimal
  interface, maximum functionality" direction.

Every API call in `src/services/*.js` is cross-checked against the actual
backend route files — confirmed a 1:1 match (see backend's Phase 1/3
routes for `auth`, `students`, `posts`, `institutions`).

## Not built yet (intentionally — mirrors the backend's own phasing)

Network, Messages, YearBook, and Notifications all render a plain
"isn't built yet" placeholder (`src/pages/ComingSoon.jsx`) rather than a
broken or fake page. These map to backend Phases 2/4/6/5 respectively,
all of which are done on the backend — the frontend for them just hasn't
been built yet.
