import { Link } from 'react-router-dom';
import { useEvents } from '../../hooks/useEvents';
import { LoadingState } from '../../components/loading/Spinner';

function formatDate(value) { return new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
export default function InstitutionEventsPage() {
  const query = useEvents({ upcoming: true });
  const items = query.data ?? [];
  return <div className="mx-auto max-w-4xl space-y-5">
    <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-yearbook">Institution Calendar</p><h1 className="mt-1 text-2xl font-bold text-text">Upcoming Events & Memorable Days</h1><p className="mt-1 text-sm text-text-secondary">Important dates, ceremonies and memorable institutional occasions.</p></div>
    {query.isLoading && <LoadingState message="Loading events…" />}
    {!query.isLoading && items.length === 0 && <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-text-secondary">No upcoming institutional events have been published.</div>}
    <div className="space-y-3">{items.map((event) => <article key={event.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><div className="flex gap-4"><div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-yearbook-soft text-yearbook"><span className="text-[10px] font-bold uppercase">{new Date(event.eventDate).toLocaleDateString(undefined,{month:'short'})}</span><span className="text-2xl font-extrabold">{new Date(event.eventDate).getDate()}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-text">{event.title}</h2><span className="rounded-full bg-bg px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-text-secondary">{event.category}</span></div><p className="mt-1 text-xs font-semibold text-text-secondary">{formatDate(event.eventDate)}{event.location ? ` · ${event.location}` : ''}</p>{event.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{event.description}</p>}</div></div></article>)}</div>
    <Link to="/" className="inline-flex text-sm font-semibold text-brand hover:underline">← Back to CollegeBook</Link>
  </div>;
}