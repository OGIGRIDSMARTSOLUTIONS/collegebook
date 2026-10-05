import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useAdminStudentSearch, useAdminCreateStudent, useAdminUpdateStudent, useAdminBulkAnalyze, useAdminBulkImport } from '../../hooks/useAdminStudents';
import { useDepartments, useAcademicSets } from '../../hooks/useInstitutionAdmin';
import { LoadingState } from '../../components/loading/Spinner';

function StudentRow({ student }) {
  const updateStudent = useAdminUpdateStudent();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: student.firstName ?? '',
    lastName: student.lastName ?? '',
    studentNumber: student.studentNumber ?? '',
    phoneNumber: student.phoneNumber ?? '',
    departmentId: student.department?.id ?? '',
  });
  const departmentsQuery = useDepartments();

  function save() {
    updateStudent.mutate(form, { onSuccess: () => setEditing(false) });
  }

  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="py-3 pr-4">
        {editing ? (<div className="flex flex-col gap-2 sm:flex-row"><input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="w-28 rounded-md border border-border bg-surface px-2 py-1 text-sm" /><input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="w-28 rounded-md border border-border bg-surface px-2 py-1 text-sm" /></div>) : <p className="font-medium text-text">{student.firstName} {student.lastName}</p>}
        <p className="text-xs text-text-secondary">{student.email || 'Account not yet created'}</p>
      </td>
      <td className="py-3 pr-4 text-text-secondary">
        {editing ? (
          <input value={form.studentNumber} onChange={(e) => setForm((f) => ({ ...f, studentNumber: e.target.value }))} className="w-36 rounded-md border border-border bg-surface px-2 py-1 text-sm" />
        ) : student.studentNumber || '—'}
      </td>
      <td className="py-3 pr-4 text-text-secondary">
        {editing ? (
          <input inputMode="numeric" maxLength={11} value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 11) }))} className="w-32 rounded-md border border-border bg-surface px-2 py-1 text-sm" />
        ) : student.phoneNumber || '—'}
      </td>
      <td className="py-3 pr-4 text-text-secondary">
        {editing ? (
          <select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} className="max-w-44 rounded-md border border-border bg-surface px-2 py-1 text-sm">
            {departmentsQuery.data?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        ) : student.department?.name || '—'}
      </td>
      <td className="py-3 pr-4 text-text-secondary">{student.academicSet?.name || '—'}</td>
      <td className="py-3 pr-4 text-text-secondary">
        {student.yearBookAttached ? <span className="text-success">Assigned</span> : <span>Pending</span>}
      </td>
      <td className="py-3">
        {editing ? (
          <div className="flex gap-2">
            <Button type="button" onClick={save} disabled={updateStudent.isPending}>Save</Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
        )}
      </td>
    </tr>
  );
}


function BulkStudentUpload() {
  const departmentsQuery = useDepartments();
  const analyze = useAdminBulkAnalyze();
  const importStudents = useAdminBulkImport();
  const [fileName, setFileName] = useState('');
  const [csvText, setCsvText] = useState('');
  const [analysis, setAnalysis] = useState(null);

  function downloadTemplate() {
    const departments = departmentsQuery.data ?? [];
    const department = departments[0]?.name || '';
    const rows = [
      ['First Name', 'Last Name', 'Other Names', 'Matriculation Number', 'Phone Number', 'Department'],
      ['John', 'Adebayo', '', 'REPLACE001', '08000000001', department],
      ['Jane', 'Okafor', 'Chiamaka', 'REPLACE002', '08000000002', department],
    ];
    const csv = rows.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'collegebook-student-upload-template.csv'; a.click(); URL.revokeObjectURL(url);
  }

  async function chooseFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name); setAnalysis(null);
    try { setCsvText(await file.text()); } catch { setCsvText(''); }
  }

  async function analyzeFile() {
    if (!csvText) return;
    const result = await analyze.mutateAsync(csvText);
    setAnalysis(result);
  }

  async function importValid() {
    if (!csvText || !analysis?.validRows) return;
    const result = await importStudents.mutateAsync(csvText);
    setAnalysis(result);
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Bulk upload</p>
          <h2 className="mt-1 text-xl font-semibold text-text">Import students from CSV</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-text-secondary">Download the template, replace the sample rows with your student list, then upload it. CollegeBook analyses every row before anything is imported.</p>
        </div>
        <Button type="button" variant="secondary" onClick={downloadTemplate}>Download CSV template</Button>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl bg-bg p-4 text-sm text-text-secondary"><strong className="text-text">Required:</strong> First Name, Last Name, Matriculation Number, Phone Number, Department.</div>
        <div className="rounded-xl bg-bg p-4 text-sm text-text-secondary"><strong className="text-text">Automatic:</strong> Academic class, faculty and internal student code are assigned by CollegeBook.</div>
        <div className="rounded-xl bg-bg p-4 text-sm text-text-secondary"><strong className="text-text">Safety:</strong> Duplicate matriculation numbers, invalid phones and unknown departments are flagged before import.</div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-bg">
          Choose CSV file
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={chooseFile} />
        </label>
        <span className="text-sm text-text-secondary">{fileName || 'No file selected'}</span>
        <Button type="button" onClick={analyzeFile} disabled={!csvText || analyze.isPending}>{analyze.isPending ? 'Analysing…' : 'Analyse CSV'}</Button>
      </div>
      {analyze.isError && <p className="mt-3 text-sm text-danger">{analyze.error.message}</p>}
      {analysis && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border p-3"><p className="text-xs text-text-secondary">Rows</p><p className="mt-1 text-xl font-bold text-text">{analysis.totalRows}</p></div>
            <div className="rounded-xl border border-success/30 bg-success/5 p-3"><p className="text-xs text-text-secondary">Ready</p><p className="mt-1 text-xl font-bold text-success">{analysis.validRows}</p></div>
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-3"><p className="text-xs text-text-secondary">Needs attention</p><p className="mt-1 text-xl font-bold text-danger">{analysis.invalidRows}</p></div>
            {'imported' in analysis && <div className="rounded-xl border border-brand/30 bg-brand-soft p-3"><p className="text-xs text-text-secondary">Imported</p><p className="mt-1 text-xl font-bold text-brand">{analysis.imported}</p></div>}
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead><tr className="border-b border-border bg-bg text-text-secondary"><th className="p-3">Row</th><th className="p-3">Student</th><th className="p-3">Matriculation</th><th className="p-3">Phone</th><th className="p-3">Department</th><th className="p-3">Result</th></tr></thead>
              <tbody>{analysis.rows.map((row) => <tr key={row.row} className="border-b border-border last:border-0"><td className="p-3 text-text-secondary">{row.row}</td><td className="p-3 font-medium text-text">{row.firstName} {row.lastName}</td><td className="p-3 text-text-secondary">{row.matriculationNumber || '—'}</td><td className="p-3 text-text-secondary">{row.phoneNumber || '—'}</td><td className="p-3 text-text-secondary">{row.department || '—'}</td><td className="p-3">{row.valid ? <span className="font-semibold text-success">Ready</span> : <span className="text-danger">{row.errors.join(' • ')}</span>}</td></tr>)}</tbody>
            </table>
          </div>
          {analysis.invalidRows > 0 && <p className="text-sm text-text-secondary">Only rows marked <strong>Ready</strong> can be imported. Correct the CSV and analyse it again to remove the flagged rows.</p>}
          {'imported' in analysis ? <p className="text-sm font-medium text-success">Import complete. {analysis.imported} student(s) were added and {analysis.skipped} row(s) were skipped.</p> : <Button type="button" onClick={importValid} disabled={!analysis.validRows || importStudents.isPending}>{importStudents.isPending ? 'Importing…' : `Import ${analysis.validRows} valid student${analysis.validRows === 1 ? '' : 's'}`}</Button>}
          {importStudents.isError && <p className="text-sm text-danger">{importStudents.error.message}</p>}
        </div>
      )}
    </section>
  );
}

function AddStudentForm({ onCreated }) {
  const createStudent = useAdminCreateStudent();
  const departmentsQuery = useDepartments();
  const setsQuery = useAcademicSets();
  const currentSet = [...(setsQuery.data ?? [])].sort((a, b) => Number(b.startYear ?? 0) - Number(a.startYear ?? 0))[0];
  const [form, setForm] = useState({ name: '', matriculationNumber: '', departmentId: '', phoneNumber: '' });

  function submit(e) {
    e.preventDefault();
    createStudent.mutate(form, {
      onSuccess: () => {
        setForm({ name: '', matriculationNumber: '', departmentId: '', phoneNumber: '' });
        onCreated?.();
      },
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Student registry</p>
          <h2 className="mt-1 text-xl font-semibold text-text">Add a student</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
            Add the official student record. The academic year is assigned automatically from the institution's current class.
          </p>
        </div>
        <div className="rounded-xl bg-brand-soft px-3 py-2 text-sm sm:min-w-44">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Current class</p>
          <p className="mt-1 font-semibold text-text">{currentSet?.name || 'Not set'}</p>
        </div>
      </div>

      {!currentSet && !setsQuery.isLoading && (
        <div className="mb-4 rounded-xl border border-dashed border-border bg-bg p-4 text-sm text-text-secondary">
          Create the academic year first. <Link className="font-semibold text-brand hover:underline" to="/admin/structure">Set up the academic year →</Link>
        </div>
      )}

      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TextField label="Student name" placeholder="Full name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <TextField label="Matriculation number" placeholder="e.g. PHA/2026/001" required value={form.matriculationNumber} onChange={(e) => setForm((f) => ({ ...f, matriculationNumber: e.target.value }))} />
        <TextField label="Phone number" placeholder="11 digits maximum" required maxLength={11} inputMode="numeric" value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 11) }))} />
        <label className="block text-sm text-text">
          <span className="mb-1 block text-xs font-medium text-text-secondary">Department</span>
          <select required value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" disabled={!currentSet}>
            <option value="" disabled>Select department</option>
            {departmentsQuery.data?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <div className="flex items-end sm:col-span-2 lg:col-span-4">
          <Button type="submit" disabled={createStudent.isPending || !currentSet}>
            {createStudent.isPending ? 'Saving…' : 'Add student'}
          </Button>
        </div>
        {createStudent.isError && <p className="sm:col-span-2 lg:col-span-4 text-sm text-danger">{createStudent.error.message}</p>}
        {createStudent.isSuccess && <p className="sm:col-span-2 lg:col-span-4 text-sm text-success">Student added to the institutional registry.</p>}
      </form>
    </section>
  );
}

export default function AdminStudentsPage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const searchParams = { q: submittedQuery || undefined, page: 1, pageSize: 50 };
  const studentsQuery = useAdminStudentSearch(searchParams);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Institutional source of truth</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-text sm:text-3xl">Students</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-text-secondary">
          Keep the official student list simple: name, matriculation number, phone and department. CollegeBook handles academic-set IDs and other internal codes automatically.
        </p>
      </div>

      <AddStudentForm onCreated={() => setSubmittedQuery('')} />

      <BulkStudentUpload />

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <form onSubmit={(e) => { e.preventDefault(); setSubmittedQuery(query.trim()); }} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1"><TextField label="Search students" placeholder="Name, matriculation number or phone" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <Button type="submit">Search</Button>
        </form>
      </section>

      {studentsQuery.isLoading && <LoadingState message="Loading student registry…" />}
      {studentsQuery.isError && <p className="text-sm text-danger">{studentsQuery.error.message}</p>}

      {studentsQuery.data?.items?.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <table className="min-w-[950px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="pb-3 pr-4 font-medium">Student</th>
                <th className="pb-3 pr-4 font-medium">Matriculation</th>
                <th className="pb-3 pr-4 font-medium">Phone</th>
                <th className="pb-3 pr-4 font-medium">Department</th>
                <th className="pb-3 pr-4 font-medium">Class</th>
                <th className="pb-3 pr-4 font-medium">YearBook</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>{studentsQuery.data.items.map((s) => <StudentRow key={s.id} student={s} />)}</tbody>
          </table>
        </div>
      )}

      {studentsQuery.data?.items?.length === 0 && <p className="text-sm text-text-secondary">No students found.</p>}
    </div>
  );
}