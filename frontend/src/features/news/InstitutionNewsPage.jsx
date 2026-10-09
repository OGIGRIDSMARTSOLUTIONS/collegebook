import { Link, useSearchParams } from 'react-router-dom';
import { useMyBroadcasts, useMarkBroadcastRead } from '../../hooks/useBroadcasts';
import { LoadingState } from '../../components/loading/Spinner';

export default function InstitutionNewsPage() {
  const [searchParams] = useSearchParams();
  const selectedBroadcastId = searchParams.get('broadcast');
  const query = useMyBroadcasts({ page: 1, pageSize: 50 });
  const markRead = useMarkBroadcastRead();
  const items = query.data?.items ?? [];
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Institution</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-text">Institutional Updates</h1>
        <p className="mt-1 text-sm text-text-secondary">Official announcements and news from your institution.</p>
      </div>
      {query.isLoading && <LoadingState message="Loading updates…" />}
      {!query.isLoading && items.length === 0 && <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-text-secondary">No institutional updates yet.</div>}
      <div className="space-y-3">
        {items.map(({ broadcast, readAt }) => {
          const isSelected = selectedBroadcastId === broadcast.id;
          return (
          <article key={broadcast.id} className={`rounded-2xl border bg-surface p-5 shadow-sm transition ${isSelected ? 'border-brand ring-2 ring-brand/20' : 'border-border'}`}> 
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-text">{broadcast.title}</h2>
                <p className="mt-1 text-xs text-text-secondary">{new Date(broadcast.createdAt).toLocaleString()}</p>
              </div>
              {!readAt && <span className="rounded-full bg-brand-soft px-2 py-1 text-[10px] font-bold text-brand">New</span>}
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-text">{broadcast.body}</p>
            {!readAt && <button type="button" onClick={() => markRead.mutate(broadcast.id)} className="mt-4 text-xs font-bold text-brand hover:underline">Mark as read</button>}
          </article>
          );
        })}
      </div>
      <Link to="/" className="inline-flex text-sm font-semibold text-brand hover:underline">← Back to CollegeBook</Link>
    </div>
  );
}