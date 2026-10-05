import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ADMIN_SECTION_ROLES } from '../constants/adminRoles';

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', end: true, section: 'dashboard' },
  { to: '/admin/structure', label: 'Academic Setup', section: 'structure' },
  { to: '/admin/students', label: 'Students', section: 'students' },
  { to: '/admin/broadcasts', label: 'Broadcasts', section: 'broadcasts' },
  { to: '/admin/events', label: 'Institutional Events', section: 'events' },
  { to: '/admin/yearbook', label: 'YearBook', section: 'yearbook' },
  { to: '/admin/moderation', label: 'Moderation', section: 'moderation' },
];

function AdminNav({ items, mobile = false, onNavigate }) {
  return (
    <nav
      aria-label="CollegeBook administration navigation"
      className={mobile ? 'space-y-1' : 'space-y-1'}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex min-h-11 items-center rounded-xl px-3.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-brand-soft text-brand'
                : 'text-text-secondary hover:bg-bg hover:text-text'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AdminLayout() {
  const { context } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const visibleNavItems = adminNavItems.filter((item) =>
    ADMIN_SECTION_ROLES[item.section].includes(context?.role),
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg text-text">
      {/* DESKTOP HEADER */}
      <header className="hidden border-b border-border bg-surface lg:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-lg font-bold tracking-tight text-text">
            College<span className="text-brand">Book</span>{' '}
            <span className="font-medium text-text-secondary">Admin</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-text-secondary transition hover:text-text">
            ← Back to CollegeBook
          </Link>
        </div>
      </header>

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4">
          <Link to="/" className="min-w-0 leading-tight">
            <span className="block text-lg font-bold tracking-tight text-text">CollegeBook</span>
            <span className="block text-sm font-semibold text-brand">Admin</span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/"
              className="hidden rounded-lg px-2 py-2 text-sm font-medium text-text-secondary sm:block"
            >
              Back to CollegeBook
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-expanded={mobileNavOpen}
              aria-controls="admin-mobile-navigation"
              className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-brand/30 bg-brand-soft text-brand shadow-sm transition hover:bg-brand-soft/80 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <span className="sr-only">Open administration menu</span>
              <span className="flex w-5 flex-col gap-1.5">
                <span className="h-0.5 w-full rounded-full bg-current" />
                <span className="h-0.5 w-full rounded-full bg-current" />
                <span className="h-0.5 w-full rounded-full bg-current" />
              </span>
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <>
            <button
              type="button"
              aria-label="Close administration menu"
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setMobileNavOpen(false)}
            />
            <div
              id="admin-mobile-navigation"
              className="absolute inset-x-0 top-full z-50 border-b border-border bg-surface p-3 shadow-[0_18px_35px_rgba(20,40,45,0.12)]"
            >
              <div className="mb-3 rounded-xl bg-bg px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-text-secondary">
                Administration
              </div>
              <AdminNav items={visibleNavItems} onNavigate={() => setMobileNavOpen(false)} />
              <Link
                to="/"
                onClick={() => setMobileNavOpen(false)}
                className="mt-2 flex min-h-11 items-center rounded-xl px-3.5 text-sm font-semibold text-text-secondary hover:bg-bg hover:text-text"
              >
                ← Back to CollegeBook
              </Link>
            </div>
          </>
        )}
      </header>

      {/* ADMIN WORKSPACE */}
      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-5 sm:px-6 sm:py-7 lg:px-6 lg:py-8">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-surface p-3 shadow-sm">
            <div className="mb-3 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Administration</p>
              <p className="mt-1 text-xs text-text-secondary">Institution management</p>
            </div>
            <AdminNav items={visibleNavItems} />
          </div>
        </aside>

        {/* PAGE CONTENT */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-4xl min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
