import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function SuperAdminLayout() {
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <span className="text-lg font-semibold text-text">CollegeBook — Super Admin</span>
          <button onClick={handleLogout} className="text-sm text-danger hover:underline">
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
