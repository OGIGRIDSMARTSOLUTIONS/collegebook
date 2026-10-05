import { useAuth } from '../hooks/useAuth';

/**
 * RoleGate — hiding a nav link (see AdminLayout) stops someone from
 * casually clicking into a section their role can't use, but doesn't
 * stop them typing the URL directly. This is the second half of that:
 * wraps the actual page element and shows a clean message instead of a
 * broken page full of failed requests when the role doesn't match.
 */
export function RoleGate({ allow, children }) {
  const { context } = useAuth();

  if (!context || !allow.includes(context.role)) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center">
        <p className="text-sm text-text-secondary">Your role doesn't have access to this section.</p>
      </div>
    );
  }

  return children;
}
