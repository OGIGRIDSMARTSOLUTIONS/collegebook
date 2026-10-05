import { useState } from 'react';
import { Link } from 'react-router-dom';
import { pickCurrentClass, isInstitutionClass } from './currentClass';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import {
  useFaculties,
  useDepartments,
  useAcademicSets,
  useCreateFaculty,
  useUpdateFaculty,
  useCreateDepartment,
  useUpdateDepartment,
  useCreateAcademicSet,
} from '../../hooks/useInstitutionAdmin';

function Section({ eyebrow, title, description, children }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>}
      <h2 className="mt-1 text-lg font-semibold text-text">{title}</h2>
      {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function AcademicYearSection() {
  const setsQuery = useAcademicSets();
  const createSet = useCreateAcademicSet();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const sets = setsQuery.data ?? [];
  const current = pickCurrentClass(sets);

  function handleSubmit(e) {
    e.preventDefault();
    createSet.mutate({ startYear: Number(year) }, { onSuccess: () => setYear(Number(year) + 1) });
  }

  return (
    <Section eyebrow="Step 1" title="Academic year / class" description="Create the institution's class once. Students never choose the year themselves.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <TextField label="Year" type="number" min="1900" max="2200" value={year} onChange={(e) => setYear(e.target.value)} required />
        </div>
        <Button type="submit" disabled={createSet.isPending}>{createSet.isPending ? 'Creating…' : `Create Class of ${year}`}</Button>
      </form>
      {createSet.isError && <p className="mt-2 text-sm text-danger">{createSet.error.message}</p>}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sets.map((set) => (
          <div key={set.id} className={`rounded-xl border px-4 py-3 ${current?.id === set.id ? 'border-brand/40 bg-brand-soft' : 'border-border bg-bg'}`}>
            <p className="font-semibold text-text">{set.name}</p>
            <p className="text-xs text-text-secondary">
              {set.department
                ? `Department cohort (${set.department.name}). Not used for new students.`
                : !isInstitutionClass(set)
                  ? `Institutional class, ${String(set.status).toLowerCase()}. Not used for new students.`
                  : current?.id === set.id ? 'Current class. New students join this one.' : 'Institutional class'}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FacultySection() {
  const facultiesQuery = useFaculties();
  const createFaculty = useCreateFaculty();
  const updateFaculty = useUpdateFaculty();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  function startEdit(faculty) { setEditingId(faculty.id); setEditingName(faculty.name); }
  function saveEdit() {
    if (!editingName.trim()) return;
    updateFaculty.mutate({ id: editingId, name: editingName.trim() }, { onSuccess: () => setEditingId(null) });
  }

  return (
    <Section eyebrow="Step 2" title="Faculties / schools" description="Enter the name only. You can edit the name later; internal identifiers remain hidden.">
      <form onSubmit={(e) => { e.preventDefault(); createFaculty.mutate({ name: name.trim() }, { onSuccess: () => setName('') }); }} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1"><TextField label="Faculty or school name" placeholder="e.g. Faculty of Science" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <Button type="submit" disabled={createFaculty.isPending}>{createFaculty.isPending ? 'Adding…' : 'Add faculty'}</Button>
      </form>
      {(createFaculty.isError || updateFaculty.isError) && <p className="mt-2 text-sm text-danger">{(createFaculty.error || updateFaculty.error).message}</p>}
      <div className="mt-4 divide-y divide-border rounded-xl border border-border">
        {(facultiesQuery.data ?? []).map((faculty) => (
          <div key={faculty.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            {editingId === faculty.id ? (
              <div className="flex flex-1 gap-2"><input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" /><Button type="button" onClick={saveEdit}>Save</Button><Button type="button" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button></div>
            ) : (
              <><p className="font-medium text-text">{faculty.name}</p><Button type="button" variant="secondary" onClick={() => startEdit(faculty)}>Edit</Button></>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function DepartmentSection() {
  const facultiesQuery = useFaculties();
  const departmentsQuery = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const [form, setForm] = useState({ name: '', facultyId: '' });
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  function startEdit(department) { setEditingId(department.id); setEditingName(department.name); }
  function saveEdit() {
    if (!editingName.trim()) return;
    updateDepartment.mutate({ id: editingId, name: editingName.trim() }, { onSuccess: () => setEditingId(null) });
  }

  return (
    <Section eyebrow="Step 3" title="Departments" description="Departments can be used for interaction across the institution. Students can connect and communicate with students in other departments.">
      {!facultiesQuery.data?.length && <div className="mb-4 rounded-xl border border-dashed border-border bg-bg p-4 text-sm text-text-secondary">Add at least one faculty or school first.</div>}
      <form onSubmit={(e) => { e.preventDefault(); createDepartment.mutate({ name: form.name.trim(), facultyId: form.facultyId }, { onSuccess: () => setForm({ name: '', facultyId: '' }) }); }} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <TextField label="Department name" placeholder="e.g. Pharmacy" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        <label className="block text-sm text-text"><span className="mb-1 block text-xs font-medium text-text-secondary">Faculty / school</span><select value={form.facultyId} onChange={(e) => setForm((f) => ({ ...f, facultyId: e.target.value }))} required disabled={!facultiesQuery.data?.length} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"><option value="" disabled>Select faculty</option>{facultiesQuery.data?.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}</select></label>
        <Button type="submit" disabled={createDepartment.isPending || !facultiesQuery.data?.length}>{createDepartment.isPending ? 'Adding…' : 'Add department'}</Button>
      </form>
      {(createDepartment.isError || updateDepartment.isError) && <p className="mt-2 text-sm text-danger">{(createDepartment.error || updateDepartment.error).message}</p>}
      <div className="mt-5 divide-y divide-border rounded-xl border border-border">
        {(departmentsQuery.data ?? []).map((department) => (
          <div key={department.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            {editingId === department.id ? (
              <div className="flex flex-1 gap-2"><input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" /><Button type="button" onClick={saveEdit}>Save</Button><Button type="button" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button></div>
            ) : (
              <><div><p className="font-medium text-text">{department.name}</p><p className="text-xs text-text-secondary">{department.faculty?.name || 'Faculty not assigned'}</p></div><Button type="button" variant="secondary" onClick={() => startEdit(department)}>Edit</Button></>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

export default function AdminStructurePage() {
  return <div className="space-y-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Institution setup</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-text sm:text-3xl">Academic Setup</h1><p className="mt-1 max-w-3xl text-sm leading-6 text-text-secondary">Set up the class, faculties and departments. CollegeBook handles technical codes automatically.</p></div><AcademicYearSection /><FacultySection /><DepartmentSection /><div className="rounded-2xl border border-brand/20 bg-brand-soft p-5"><p className="text-sm font-semibold text-text">Ready to add students?</p><p className="mt-1 text-sm leading-6 text-text-secondary">Students are attached to the current class automatically.</p><Link to="/admin/students" className="mt-3 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Go to Student Registry →</Link></div></div>;
}
