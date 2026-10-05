import { useEffect, useMemo, useState } from 'react';
import { useNewsFeeds } from '../../hooks/useNewsFeeds';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '✦' },
  { id: 'graduation', label: 'Graduation & Student Life', icon: '🎓' },
  { id: 'jobs', label: 'Jobs & Internships', icon: '💼' },
  { id: 'relationships', label: 'Relationships', icon: '❤️' },
  { id: 'scholarships', label: 'Scholarships & Opportunities', icon: '🎓' },
  { id: 'technology', label: 'Technology & Skills', icon: '💻' },
  { id: 'entrepreneurship', label: 'Business & Entrepreneurship', icon: '🚀' },
  { id: 'competitions', label: 'Competitions & Challenges', icon: '🏆' },
];

export default function NewsFeedsPage() {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { data, isLoading, isFetching, isError } = useNewsFeeds({
    category: category === 'all' ? undefined : category,
    q: query.trim() || undefined,
    limit: 30,
  });

  useEffect(() => {
    if (data?.updatedAt) setLastUpdated(new Date(data.updatedAt));
    else if (!isFetching) setLastUpdated(new Date());
  }, [data?.updatedAt, isFetching]);

  const items = useMemo(() => {
    const sourceItems = Array.isArray(data?.items) ? data.items : [];
    const normalizedQuery = query.trim().toLowerCase();

    return sourceItems.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;
      return [item.title, item.description, item.source, item.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [data?.items, category, query]);

  const grouped = useMemo(() => {
    return CATEGORIES.filter((item) => item.id !== 'all').map((cat) => ({
      ...cat,
      items: items.filter((item) => item.category === cat.id),
    })).filter((group) => group.items.length);
  }, [items]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border bg-gradient-to-br from-brand-soft/60 via-surface to-surface px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                Live discovery
              </div>
              <h1 className="text-2xl font-bold tracking-[-0.035em] text-text sm:text-3xl">
                News &amp; Feeds
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                Discover graduation news, jobs, internships, relationships, scholarships, skills and opportunities selected with students in mind.
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-border bg-surface px-4 py-3 text-xs text-text-secondary shadow-sm">
              <p className="font-semibold text-text">Auto-refresh</p>
              <p className="mt-0.5">Every 15 minutes</p>
              <p className="mt-1 text-[10px]">Updated {formatRelative(lastUpdated)}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-border px-4 py-4 sm:px-7">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search graduation, jobs, relationships, scholarships, internships..."
              className="w-full rounded-2xl border border-border bg-bg py-3 pl-10 pr-4 text-sm text-text outline-none transition placeholder:text-text-secondary focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/10"
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  category === item.id
                    ? 'bg-brand text-white shadow-sm'
                    : 'border border-border bg-surface text-text-secondary hover:bg-bg hover:text-text'
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {isError && (
          <div className="mx-5 mt-5 rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3 text-xs leading-5 text-text-secondary sm:mx-7">
            The live feed service could not be reached right now. CollegeBook will retry automatically.
          </div>
        )}

        {isLoading ? (
          <LoadingState />
        ) : category === 'all' && !query.trim() ? (
          <div className="space-y-8 p-5 sm:p-7">
            {grouped.length ? grouped.map((group) => (
              <FeedSection key={group.id} group={group} />
            )) : <EmptyState />}
          </div>
        ) : (
          <div className="p-5 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text">{category === 'all' ? 'Search results' : CATEGORIES.find((item) => item.id === category)?.label}</h2>
                <p className="mt-1 text-xs text-text-secondary">{items.length} item{items.length === 1 ? '' : 's'}</p>
              </div>
              {isFetching && <span className="text-[10px] font-semibold text-brand">Updating…</span>}
            </div>
            {items.length ? <div className="grid gap-4 md:grid-cols-2">{items.map((item) => <FeedCard key={item.id} item={item} />)}</div> : <EmptyState />}
          </div>
        )}
      </section>

      <p className="px-2 py-4 text-[10px] leading-5 text-text-secondary">
        CollegeBook displays links and summaries from approved external sources. Selecting a story takes you to its original publisher.
      </p>
    </div>
  );
}

function FeedSection({ group }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-text"><span className="mr-2">{group.icon}</span>{group.label}</h2>
          <p className="mt-1 text-[11px] text-text-secondary">Fresh opportunities and stories for students.</p>
        </div>
        <span className="text-[10px] font-semibold text-brand">{group.items.length} updates</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {group.items.slice(0, 4).map((item) => <FeedCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}

function FeedCard({ item }) {
  const date = item.publishedAt ? new Date(item.publishedAt) : null;
  const external = item.url && item.url !== '#';
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" className="h-40 w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-20 items-end bg-gradient-to-br from-brand-soft/80 to-bg px-4 pb-3">
          <span className="rounded-full bg-surface/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-brand shadow-sm">{labelFor(item.category)}</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between gap-3 text-[10px] text-text-secondary">
          <span className="truncate font-semibold">{item.source || 'External source'}</span>
          {date && !Number.isNaN(date.getTime()) && <time dateTime={date.toISOString()}>{formatRelative(date)}</time>}
        </div>
        <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-text">{item.title}</h3>
        {item.description && <p className="mt-2 line-clamp-3 text-xs leading-5 text-text-secondary">{item.description}</p>}
        {external ? (
          <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-brand hover:underline">
            Read original story <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span className="mt-3 inline-flex text-[10px] font-semibold text-text-secondary">Awaiting live source connection</span>
        )}
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
      {[1, 2, 3, 4].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl bg-bg" />)}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <div className="text-2xl">📰</div>
      <h3 className="mt-3 text-sm font-bold text-text">No stories found</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-text-secondary">Try another category or search term. New approved feeds will appear here automatically.</p>
    </div>
  );
}

function labelFor(category) {
  return CATEGORIES.find((item) => item.id === category)?.label || 'News';
}

function formatRelative(date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SearchIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>;
}
