import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ADMIN_SECTION_ROLES, ADMIN_SECTION_PATHS } from '../../constants/adminRoles';
import AdminDashboardPage from './AdminDashboardPage';

/**
 * /admin is every staff role's landing page (AdminRoute lets all of them
 * in), but the Dashboard itself is only INSTITUTION_ADMIN/MODERATOR per
 * the backend — so a YearBook Admin landing here would otherwise hit a
 * page that immediately 403s. Send them to the first section their role
 * can actually use instead.
 */
export default function AdminIndex() {
  const { context } = useAuth();

  if (ADMIN_SECTION_ROLES.dashboard.includes(context?.role)) {
    return <AdminDashboardPage />;
  }

  const firstAccessible = Object.entries(ADMIN_SECTION_ROLES).find(
    ([key, roles]) => key !== 'dashboard' && roles.includes(context?.role)
  );

  if (firstAccessible) {
    return <Navigate to={ADMIN_SECTION_PATHS[firstAccessible[0]]} replace />;
  }

  // Shouldn't happen — AdminRoute already restricts entry to roles that
  // appear in at least one of these lists — but fail safely rather than
  // loop or crash if it ever does.
  return (
    <div className="rounded-lg border border-border bg-surface p-6 text-center">
      <p className="text-sm text-text-secondary">Your role doesn't have access to any admin section.</p>
    </div>
  );
}
