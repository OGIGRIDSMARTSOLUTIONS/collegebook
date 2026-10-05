import { useState } from 'react';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import {
  useAllInstitutions,
  useCreateInstitution,
  useCreateInstitutionAdmin,
} from '../../hooks/useSuperAdmin';
import { LoadingState } from '../../components/loading/Spinner';

function CreateInstitutionForm() {
  const [form, setForm] = useState({ institutionCode: '', name: '', shortName: '', location: '', website: '' });
  const createInstitution = useCreateInstitution();

  function handleSubmit(e) {
    e.preventDefault();
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim() !== ''));
    createInstitution.mutate(payload, {
      onSuccess: () => setForm({ institutionCode: '', name: '', shortName: '', location: '', website: '' }),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-text">Create a new institution</h2>
      <TextField label="Institution code" value={form.institutionCode} onChange={(e) => setForm((f) => ({ ...f, institutionCode: e.target.value }))} placeholder="e.g. UNILAG" required />
      <TextField label="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      <TextField label="Short name (optional)" value={form.shortName} onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))} />
      <TextField label="Location (optional)" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
      <TextField label="Website (optional)" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://…" />
      {createInstitution.isError && <p className="text-sm text-danger">{createInstitution.error.message}</p>}
      {createInstitution.isSuccess && <p className="text-sm text-success">Institution created.</p>}
      <Button type="submit" loading={createInstitution.isPending} loadingLabel="Creating…">Create institution</Button>
    </form>
  );
}

function CreateAdminForm({ institution, onClose }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const createAdmin = useCreateInstitutionAdmin();

  function handleSubmit(e) {
    e.preventDefault();
    createAdmin.mutate(
      { institutionId: institution.id, payload: form },
      { onSuccess: () => onClose?.() }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-md border border-brand/30 bg-brand-soft/30 p-3">
      <div className="mb-3">
        <p className="text-sm font-semibold text-text">Create institution administrator</p>
        <p className="text-xs text-text-secondary">This administrator will have full administrative access to {institution.name} only.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="First name" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required />
        <TextField label="Last name" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required />
        <TextField label="Email address" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
        <TextField label="Temporary password" type="password" minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
      </div>
      {createAdmin.isError && <p className="mt-3 text-sm text-danger">{createAdmin.error.message}</p>}
      {createAdmin.isSuccess && <p className="mt-3 text-sm text-success">Administrator created successfully.</p>}
      <div className="mt-3 flex gap-2">
        <Button type="submit" loading={createAdmin.isPending} loadingLabel="Creating…">Create admin</Button>
        <Button type="button" variant="secondary" onClick={onClose} disabled={createAdmin.isPending}>Cancel</Button>
      </div>
    </form>
  );
}

export default function SuperAdminDashboardPage() {
  const institutionsQuery = useAllInstitutions();
  const [adminFor, setAdminFor] = useState(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Institutions on CollegeBook</h1>
        <p className="mt-1 text-sm text-text-secondary">Create schools and assign their first institution administrator.</p>
      </div>

      <CreateInstitutionForm />

      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-text">All institutions</h2>
        {institutionsQuery.isLoading && <LoadingState message="Loading institutions…" />}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Code</th>
                <th className="pb-2 pr-4 font-medium">Students</th>
                <th className="pb-2 pr-4 font-medium">Admins</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {institutionsQuery.data?.map((inst) => (
                <tr key={inst.id} className="border-b border-border last:border-0 align-top">
                  <td className="py-3 pr-4 text-text">{inst.name}</td>
                  <td className="py-3 pr-4 text-text-secondary">{inst.institutionCode}</td>
                  <td className="py-3 pr-4 text-text-secondary">{inst._count?.students ?? 0}</td>
                  <td className="py-3 pr-4 text-text-secondary">{inst._count?.staff ?? 0}</td>
                  <td className="py-3 pr-4 text-text-secondary">{inst.status}</td>
                  <td className="py-3">
                    <Button type="button" variant="secondary" onClick={() => setAdminFor(adminFor?.id === inst.id ? null : inst)}>
                      {adminFor?.id === inst.id ? 'Close' : 'Create admin'}
                    </Button>
                    {adminFor?.id === inst.id && <CreateAdminForm institution={inst} onClose={() => setAdminFor(null)} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
