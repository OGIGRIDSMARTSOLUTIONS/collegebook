import { useEffect, useId, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';
import { AuthLayout } from '../../layouts/AuthLayout';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';

const initialForm = {
  matriculationNumber: '',
  departmentId: '',
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

  // The department list comes from the matriculation number: once the
  // student stops typing, we load the departments of the school that holds
  // that record. No school is ever named or listed on this page.
  const matricKey = form.matriculationNumber.trim().replace(/\s+/g, '').toUpperCase();
  const [debouncedMatric, setDebouncedMatric] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedMatric(matricKey.length >= 3 ? matricKey : ''), 500);
    return () => clearTimeout(timer);
  }, [matricKey]);

  const departmentsQuery = useQuery({
    queryKey: ['registration-departments', debouncedMatric],
    queryFn: () => authService.registrationDepartments(debouncedMatric),
    enabled: Boolean(debouncedMatric),
    staleTime: 0, // always live, so newly added departments appear
    retry: false,
  });
  const departments = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data]);

  // A different matric number means a possibly different school: clear
  // a department chosen for the previous one.
  useEffect(() => {
    setForm((current) => (current.departmentId && !departments.some((d) => d.id === current.departmentId)
      ? { ...current, departmentId: '' }
      : current));
  }, [departments]);

  const facultyGroups = useMemo(() => groupByFaculty(departments), [departments]);

  function update(field) {
    return (e) => setForm((current) => ({ ...current, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.departmentId && !form.phoneNumber.trim()) {
      setError('Choose your department or enter your phone number for student verification.');
      return;
    }

    try {
      await register({
        matriculationNumber: form.matriculationNumber.trim(),
        departmentId: form.departmentId || undefined,
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
            Your matriculation number is required. Choose your department, enter your phone number, or both.
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

        <SelectField
          label="Department"
          value={form.departmentId}
          onChange={update('departmentId')}
          disabled={!departments.length}
        >
          <option value="">
            {!debouncedMatric
              ? 'Enter your matriculation number first'
              : departmentsQuery.isFetching && !departments.length
                ? 'Finding your departments…'
                : departments.length
                  ? 'Select your department'
                  : 'No departments available'}
          </option>
          {facultyGroups.map(({ faculty, departments: list }) =>
            faculty ? (
              <optgroup key={faculty} label={faculty}>
                {list.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </optgroup>
            ) : (
              list.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)
            )
          )}
        </SelectField>

        {departmentsQuery.isError && debouncedMatric && (
          <p className="-mt-2 text-xs text-danger">
            {departmentsQuery.error?.status === 404
              ? departmentsQuery.error.message
              : <>Couldn't load departments. <button type="button" className="font-semibold underline" onClick={() => departmentsQuery.refetch()}>Try again</button>, or verify with your phone number below.</>}
          </p>
        )}

        <TextField
          label="Phone number"
          type="tel"
          placeholder="e.g. 08012345678"
          autoComplete="tel"
          value={form.phoneNumber}
          onChange={update('phoneNumber')}
        />

        <p className="-mt-1 text-xs text-text-secondary">Choose your department, enter your phone number, or both.</p>

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

/** Departments grouped under their faculty, faculties A–Z. */
function groupByFaculty(departments) {
  const groups = new Map();
  departments.forEach((d) => {
    const key = d.facultyName || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => (a && b ? a.localeCompare(b) : a ? -1 : 1))
    .map(([faculty, list]) => ({ faculty, departments: list }));
}

/** Native select styled like TextField: works well with phone pickers and screen readers. */
function SelectField({ label, children, className = '', ...props }) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-medium text-text">{label}</span>
      <div className="relative">
        <select
          id={id}
          className={`w-full appearance-none rounded-md border border-border bg-surface py-2 pl-3 pr-9 text-text focus:border-brand disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
          {...props}
        >
          {children}
        </select>
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
        </svg>
      </div>
    </label>
  );
}
