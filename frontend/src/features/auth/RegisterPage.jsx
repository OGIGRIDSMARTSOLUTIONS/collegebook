import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';

const initialForm = {
  matriculationNumber: '',
  department: '',
  phoneNumber: '',
  email: '',
  password: '',
};

export default function RegisterPage() {
  const { register, isRegistering } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function update(field) {
    return (e) => setForm((current) => ({ ...current, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.department.trim() && !form.phoneNumber.trim()) {
      setError('Enter either your department or phone number for student verification.');
      return;
    }

    try {
      await register({
        matriculationNumber: form.matriculationNumber.trim(),
        department: form.department.trim() || undefined,
        phoneNumber: form.phoneNumber.trim() || undefined,
        email: form.email.trim(),
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Unable to create your account');
    }
  }

  if (success) {
    return (
      <AuthLayout title="Account created" subtitle="Your student identity has been verified.">
        <div className="rounded-xl border border-border bg-surface p-4 text-sm leading-6 text-text">
          Your CollegeBook account is linked to the institutional student record supplied by your school.
          You can now sign in and continue to your institution, department, academic set and YearBook.
        </div>
        <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
          Go to sign in
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="Verify your student identity and join your institution on CollegeBook.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-brand/20 bg-brand-soft/40 p-4 text-sm text-text-secondary">
          <p className="font-semibold text-text">Student verification</p>
          <p className="mt-1 leading-6">
            Your matriculation number is required. Enter either your department, phone number, or both.
            Your institution already has the academic record — CollegeBook will place your account in the correct department, set and YearBook automatically.
          </p>
        </div>

        <TextField
          label="Matriculation number"
          required
          placeholder="e.g. CSC/2022/045"
          autoComplete="off"
          value={form.matriculationNumber}
          onChange={update('matriculationNumber')}
        />

        <TextField
          label="Department"
          placeholder="e.g. Computer Science"
          autoComplete="organization-title"
          value={form.department}
          onChange={update('department')}
        />

        <TextField
          label="Phone number"
          type="tel"
          placeholder="e.g. 08012345678"
          autoComplete="tel"
          value={form.phoneNumber}
          onChange={update('phoneNumber')}
        />

        <p className="-mt-1 text-xs text-text-secondary">At least one of Department or Phone number is required.</p>

        <TextField label="Email" type="email" autoComplete="email" required value={form.email} onChange={update('email')} />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={update('password')}
        />

        {error && <div className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}

        <Button type="submit" className="w-full" disabled={isRegistering}>
          {isRegistering ? 'Verifying student record…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand hover:text-brand-hover">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
