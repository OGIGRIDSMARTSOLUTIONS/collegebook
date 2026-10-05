import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthLayout } from '../../layouts/AuthLayout';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const { login, isLoggingIn, loginWithGoogle, isLoggingInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const redirectTo = location.state?.from?.pathname || '/';
  // Mirrors main.jsx's own check — GoogleOAuthProvider only wraps the app
  // when this is set, so <GoogleLogin> would throw (missing context) if
  // rendered without it. Same "optional feature, no half-configured
  // state" pattern as Redis on the backend.
  const googleEnabled = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const result = await login(form);
      navigate(result.role === 'SUPER_ADMIN' ? '/super-admin' : redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in');
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError(null);
    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      navigate(result.role === 'SUPER_ADMIN' ? '/super-admin' : redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in with Google');
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your CollegeBook account.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && (
          <div className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>
        )}
        <Button type="submit" className="w-full" disabled={isLoggingIn}>
          {isLoggingIn ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-secondary">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed')}
              text="signin_with"
              width="100%"
            />
          </div>
          {isLoggingInWithGoogle && (
            <p className="mt-2 text-center text-sm text-text-secondary">Signing in…</p>
          )}
          <p className="mt-2 text-center text-xs text-text-secondary">
            Only works if you already have a CollegeBook account with this email.
          </p>
        </>
      )}

      <p className="mt-6 text-sm text-text-secondary">
        New to CollegeBook?{' '}
        <Link to="/register" className="font-medium text-brand hover:text-brand-hover">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
