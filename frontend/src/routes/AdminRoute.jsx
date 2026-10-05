import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const STAFF_ROLES = ['INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR', 'YEARBOOK_ADMIN', 'SUPER_ADMIN'];

/**
 * AdminRoute — sits INSIDE ProtectedRoute (so authentication is already
 * guaranteed) and additionally checks role. This is a UX convenience,
 * not the real security boundary — every admin endpoint independently
 * enforces its own role/tenant checks server-side (requireRole,
 * requireInstitutionScope), tested extensively in Phases 1/5/6/7. A
 * student who somehow reached an admin page by guessing a URL would
 * still get 403s from every actual API call; this just avoids showing
 * them the page in the first place.
 */
export function AdminRoute() {
  const { context } = useAuth();

  if (!context || !STAFF_ROLES.includes(context.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
