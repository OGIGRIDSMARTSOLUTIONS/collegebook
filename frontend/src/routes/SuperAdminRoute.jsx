import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * SuperAdminRoute — unlike AdminRoute (which allows several institution
 * staff roles), this allows ONLY SUPER_ADMIN. It also deliberately does
 * NOT sit inside MainLayout's tree — a super admin has no Student record
 * (see prisma/seed.js's seedSuperAdmin), so anything depending on
 * useProfile() (which fetches GET /students/me) would break for them.
 */
export function SuperAdminRoute() {
  const { context } = useAuth();

  if (!context || context.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
