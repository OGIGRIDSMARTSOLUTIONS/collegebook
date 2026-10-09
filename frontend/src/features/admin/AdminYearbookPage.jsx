import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { studentService } from '../../services/student.service';
import { useProfile } from '../../hooks/useProfile';
import { useYearbook, useYearbookStudents } from '../../hooks/useYearbook';
import {
  useAdminYearbooks,
  useCreateYearbook,
  useYearbookStatusActions,
  useYearbookContentActions,
} from '../../hooks/useYearbookAdmin';
import { LoadingState } from '../../components/loading/Spinner';

const SECTION_KINDS = ['FACULTY', 'DEPARTMENT', 'EVENTS', 'ACHIEVEMENTS', 'MEMORIES'];

function CreateYearbookForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ year: `year ${new Date().getFullYear()}`, welcomeMessage: '' });
  const createYearbook = useCreateYearbook();

  function handleSubmit(e) {
    e.preventDefault();
    createYearbook.mutate(
      { year: form.year.trim(), welcomeMessage: form.welcomeMessage || undefined },
      {
        onSuccess: (yb) => {
          setOpen(false);
          onCreated(yb.id);
        },
      }
    );
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Create YearBook
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <input
        type="text"
        placeholder="year 2026 or year 2026a"
        value={form.year}
        onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
        className="w-32 rounded-md border border-border bg-surface px-3 py-2 text-text"
      />
      <TextField
        label="Welcome message (optional)"
        value={form.welcomeMessage}
        onChange={(e) => setForm((f) => ({ ...f, welcomeMessage: e.target.value }))}
      />
      {createYearbook.isError && <p className="text-sm text-danger">{createYearbook.error.message}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="submit" disabled={createYearbook.isPending}>
          Create
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function YearbookList({ onSelect }) {
  const yearbooksQuery = useAdminYearbooks();

  return (
    <div className="space-y-3">
      {yearbooksQuery.data?.map((yb) => (
        <button
          key={yb.id}
          onClick={() => onSelect(yb.id)}
          className="group block w-full rounded-2xl border border-border bg-surface p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-yearbook/40 hover:shadow-md"
        >
          <div className="flex items-center gap-2">
            <div>
<span className="text-[10px] font-bold uppercase tracking-[0.15em] text-yearbook">Edition</span>
<p className="yearbook-serif mt-0.5 text-2xl font-bold text-text">{yb.year}</p>
</div>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
              {yb.status}
            </span>
          </div>
        </button>
      ))}
      {yearbooksQuery.data?.length === 0 && <p className="text-sm text-text-secondary">No YearBooks yet.</p>}
    </div>
  );
}

function AddSectionForm({ id }) {
  const [form, setForm] = useState({ kind: 'MEMORIES', title: '', order: 0 });
  const { addSection } = useYearbookContentActions(id);

  function handleSubmit(e) {
    e.preventDefault();
    addSection.mutate(form, { onSuccess: () => setForm({ kind: 'MEMORIES', title: '', order: 0 }) });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      <select
        value={form.kind}
        onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
      >
        {SECTION_KINDS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      <TextField
        label=""
        placeholder="Section title"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        required
      />
      <Button type="submit" disabled={addSection.isPending}>
        Add section
      </Button>
    </form>
  );
}

function AddStudentEntryForm({ id }) {
  const { data: me } = useProfile();
  const institutionCode = me?.institution?.institutionCode;

  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [quote, setQuote] = useState('');
  const { addStudentEntry } = useYearbookContentActions(id);

  const searchParams = institutionCode && submittedQuery ? { q: submittedQuery, institutionCode } : null;
  const searchQuery = useQuery({
    queryKey: ['students', 'search-for-yearbook', searchParams],
    queryFn: () => studentService.search(searchParams),
    enabled: !!searchParams,
  });

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSubmittedQuery(query.trim());
  }

  function handleAdd() {
    addStudentEntry.mutate(
      { studentId: selected.id, quote: quote || undefined },
      {
        onSuccess: () => {
          setSelected(null);
          setQuote('');
          setQuery('');
          setSubmittedQuery('');
        },
      }
    );
  }

  if (selected) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-border bg-bg p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <span className="text-sm text-text">
          Adding <strong>{selected.firstName} {selected.lastName}</strong>
        </span>
        <TextField label="" placeholder="Quote (optional)" value={quote} onChange={(e) => setQuote(e.target.value)} />
        {addStudentEntry.isError && <p className="text-sm text-danger">{addStudentEntry.error.message}</p>}
        <Button onClick={handleAdd} disabled={addStudentEntry.isPending}>
          {addStudentEntry.isPending ? 'Adding…' : 'Confirm add'}
        </Button>
        <Button variant="ghost" onClick={() => setSelected(null)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <TextField
          label=""
          placeholder="Search by name to add a student"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {searchQuery.isLoading && <LoadingState message="Searching…" compact />}

      {searchQuery.data?.items?.length > 0 && (
        <ul className="mt-2 divide-y divide-border rounded-md border border-border">
          {searchQuery.data.items.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSelected(s)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-bg"
              >
                <span className="text-text">
                  {s.firstName} {s.lastName}
                </span>
                <span className="text-text-secondary">{s.academicSet?.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {submittedQuery && searchQuery.data?.items?.length === 0 && (
        <p className="mt-2 text-sm text-text-secondary">No students found for "{submittedQuery}".</p>
      )}
    </div>
  );
}

function YearbookDetail({ id, onBack }) {
  const yearbookQuery = useYearbook(id);
  const studentsQuery = useYearbookStudents(id);
  const { publish, archive } = useYearbookStatusActions(id);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-text-secondary hover:text-text">
        ← Back to YearBooks
      </button>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-text">
            {yearbookQuery.data?.year} — {yearbookQuery.data?.status}
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {yearbookQuery.data?.status !== 'PUBLISHED' && (
              <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
                Publish
              </Button>
            )}
            {yearbookQuery.data?.status !== 'ARCHIVED' && (
              <Button variant="ghost" onClick={() => archive.mutate()} disabled={archive.isPending}>
                Archive
              </Button>
            )}
          </div>
        </div>
        {yearbookQuery.data?.welcomeMessage && (
          <p className="mt-2 text-sm text-text-secondary">{yearbookQuery.data.welcomeMessage}</p>
        )}
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-text">Sections</h3>
        <ul className="mb-3 space-y-1 text-sm text-text">
          {yearbookQuery.data?.sections?.map((s) => (
            <li key={s.id}>
              {s.title} <span className="text-text-secondary">({s.kind})</span>
            </li>
          ))}
        </ul>
        <AddSectionForm id={id} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-text">Students</h3>
        <ul className="mb-3 space-y-2">
          {studentsQuery.data?.map((entry) => (
            <li key={entry.id} className="flex items-center gap-2 text-sm text-text">
              {entry.student?.profilePhotoUrl ? (
                <img
                  src={entry.student.profilePhotoUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                  {entry.student?.firstName?.[0]}
                  {entry.student?.lastName?.[0]}
                </span>
              )}
              <span>
                {entry.student?.firstName} {entry.student?.lastName}
                {entry.quote && <span className="text-text-secondary"> — "{entry.quote}"</span>}
              </span>
            </li>
          ))}
        </ul>
        <AddStudentEntryForm id={id} />
      </section>
    </div>
  );
}

export default function AdminYearbookPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');

  function select(id) {
    setSearchParams(id ? { id } : {});
  }

  return (
    <div className="space-y-6">
      {!selectedId && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yearbook">Institutional archive</p>
<h1 className="yearbook-serif mt-1 text-3xl font-bold text-text">YearBook Studio</h1>
<p className="mt-1 text-sm text-text-secondary">Build, curate and publish your institution’s official digital yearbooks.</p>
</div>
            <CreateYearbookForm onCreated={select} />
          </div>
          <YearbookList onSelect={select} />
        </>
      )}
      {selectedId && <YearbookDetail id={selectedId} onBack={() => select(null)} />}
    </div>
  );
}