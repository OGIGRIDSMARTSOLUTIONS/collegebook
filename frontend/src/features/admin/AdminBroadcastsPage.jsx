import { useState } from 'react';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useSentBroadcasts, useCreateBroadcast } from '../../hooks/useBroadcasts';
import { useFaculties, useDepartments, useAcademicSets } from '../../hooks/useInstitutionAdmin';

const SCOPES = ['ALL', 'SET', 'DEPARTMENT', 'FACULTY'];

function ScopeIdPicker({ scope, value, onChange }) {
  const facultiesQuery = useFaculties();
  const departmentsQuery = useDepartments();
  const setsQuery = useAcademicSets();

  if (scope === 'ALL') return null;

  const options = { SET: setsQuery.data, DEPARTMENT: departmentsQuery.data, FACULTY: facultiesQuery.data }[scope] ?? [];

  return (
    <select
      multiple
      value={value}
      onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
      className="h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

function CreateBroadcastForm() {
  const [form, setForm] = useState({ title: '', body: '', scope: 'ALL', scopeIds: [] });
  const createBroadcast = useCreateBroadcast();

  function handleSubmit(e) {
    e.preventDefault();
    const payload = form.scope === 'ALL' ? { title: form.title, body: form.body, scope: 'ALL' } : form;
    createBroadcast.mutate(payload, {
      onSuccess: () => setForm({ title: '', body: '', scope: 'ALL', scopeIds: [] }),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-text">Send an announcement</h2>
      <TextField
        label="Title"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        required
      />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-text">Message</span>
        <textarea
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          rows={3}
          required
          className="w-full resize-none rounded-md border border-border bg-surface p-2 text-text"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-text">Audience</span>
        <select
          value={form.scope}
          onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value, scopeIds: [] }))}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text"
        >
          {SCOPES.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'Everyone' : s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </label>
      {form.scope !== 'ALL' && (
        <ScopeIdPicker
          scope={form.scope}
          value={form.scopeIds}
          onChange={(ids) => setForm((f) => ({ ...f, scopeIds: ids }))}
        />
      )}

      {createBroadcast.isError && <p className="text-sm text-danger">{createBroadcast.error.message}</p>}
      {createBroadcast.isSuccess && <p className="text-sm text-success">Broadcast sent.</p>}

      <Button type="submit" disabled={createBroadcast.isPending}>
        {createBroadcast.isPending ? 'Sending…' : 'Send'}
      </Button>
    </form>
  );
}

export default function AdminBroadcastsPage() {
  const sentQuery = useSentBroadcasts();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text">Broadcasts</h1>
      <CreateBroadcastForm />

      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-text">Sent</h2>
        {sentQuery.data?.items?.length === 0 && <p className="text-sm text-text-secondary">Nothing sent yet.</p>}
        <div className="space-y-2">
          {sentQuery.data?.items?.map((b) => (
            <div key={b.id} className="border-b border-border pb-2 last:border-0">
              <p className="text-sm font-medium text-text">{b.title}</p>
              <p className="text-sm text-text-secondary">{b.body}</p>
              <p className="text-xs text-text-secondary">
                {b.scope} · {new Date(b.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
