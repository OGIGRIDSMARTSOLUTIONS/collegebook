import { Link } from 'react-router-dom';
import { useUpcomingBirthdays } from '../../hooks/useBirthdays';
import { LoadingState } from '../../components/loading/Spinner';

function birthdayLabel(date) {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}
export default function BirthdaysPage() {
  const query = useUpcomingBirthdays(30);
  const items = query.data ?? [];
  return <div className="mx-auto max-w-4xl space-y-5">
    <div>
<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Community</p>
<h1 className="mt-1 text-2xl font-bold text-text">Birthdays</h1>
<p className="mt-1 text-sm text-text-secondary">Upcoming birthdays shared by members of your institution.</p>
</div>
    {query.isLoading && <LoadingState message="Loading birthdays…" />}
    {!query.isLoading && items.length === 0 && <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-text-secondary">No upcoming birthdays have been shared.</div>}
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((student) => <Link key={student.id} to={`/profile/${student.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:border-brand/30 hover:bg-brand-soft/20">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-sm font-bold text-brand">{student.profilePhotoUrl ? <img src={student.profilePhotoUrl} alt="" className="h-full w-full object-cover" /> : `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`}</div>
        <div className="min-w-0">
<p className="font-semibold text-text">{student.firstName} {student.lastName}</p>
<p className="text-xs text-text-secondary">{birthdayLabel(student.birthdayDate)} · {student.academicSet?.name ?? 'Institution member'}</p>
</div>
      </Link>)}
    </div>
  </div>;
}