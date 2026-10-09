import { useEffect, useMemo, useState } from 'react';
import { useNewsFeeds } from '../../hooks/useNewsFeeds';
import { newsFeedService } from '../../services/newsFeed.service';

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedStory, setSelectedStory] = useState(null);
  const { data, isLoading, isFetching, isError } = useNewsFeeds({
    category: category === 'all' ? undefined : category,
    q: query.trim() || undefined,
    limit: 30,
  });

  useEffect(() => {
    const timer = window.setInterval(() => setActiveIndex((value) => value + 1), 30 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (data?.updatedAt) setLastUpdated(new Date(data.updatedAt));
    else if (!isFetching) setLastUpdated(new Date());
  }, [data?.updatedAt, isFetching]);

  useEffect(() => {
    if (!selectedStory) return undefined;

    const close = (event) => event.key === 'Escape' && setSelectedStory(null);
    const previousOverflow = document.body.style.overflow;

    // Keep the page behind the story still while the article itself scrolls.
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', close);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', close);
    };
  }, [selectedStory]);

  const items = useMemo(() => {
    const sourceItems = Array.isArray(data?.items) ? data.items : [];
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = sourceItems.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;
      return [item.title, item.description, item.source, item.category]
        .filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);
    });
    return filtered;
  }, [data?.items, category, query]);

  const currentStory = items.length ? items[activeIndex % items.length] : null;

  useEffect(() => {
    if (currentStory?.url) newsFeedService.prefetchArticle(currentStory.url);
  }, [currentStory?.url]);

  const showPreviousStory = () => {
    if (!items.length) return;
    setActiveIndex((value) => (value - 1 + items.length) % items.length);
  };

  const showNextStory = () => {
    if (!items.length) return;
    setActiveIndex((value) => (value + 1) % items.length);
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [category, query]);

  const remainingStories = useMemo(() => {
    if (!currentStory) return items;
    return items.filter((item) => item.id !== currentStory.id);
  }, [items, currentStory]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border bg-gradient-to-br from-brand-soft/60 via-surface to-surface px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />Live discovery</div>
              <h1 className="text-2xl font-bold tracking-[-0.035em] text-text sm:text-3xl">News &amp; Feeds</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">Discover graduation news, jobs, internships, relationships, scholarships, skills and opportunities selected with students in mind.</p>
            </div>
            <div className="shrink-0 rounded-2xl border border-border bg-surface px-4 py-3 text-xs text-text-secondary shadow-sm">
              <p className="font-semibold text-text">Live news stream</p>
<p className="mt-0.5">Next story every 30 seconds</p>
<p className="mt-1 text-[10px]">Updated {formatRelative(lastUpdated)}</p>
            </div>
          </div>
        </div>
        <div className="border-b border-border px-4 py-4 sm:px-7">
          <div className="relative">
<SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search graduation, jobs, relationships, scholarships, internships..." className="w-full rounded-2xl border border-border bg-bg py-3 pl-10 pr-4 text-sm text-text outline-none transition placeholder:text-text-secondary focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/10" />
</div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{CATEGORIES.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${category === item.id ? 'bg-brand text-white shadow-sm' : 'border border-border bg-surface text-text-secondary hover:bg-bg hover:text-text'}`}>
<span className="mr-1.5">{item.icon}</span>{item.label}</button>)}</div>
        </div>
        {isError && <div className="mx-5 mt-5 rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3 text-xs leading-5 text-text-secondary sm:mx-7">The live feed service could not be reached right now. CollegeBook will retry automatically.</div>}
        {isLoading ? <LoadingState /> : items.length ? (
          <div className="p-5 sm:p-7">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-text">Now showing</h2>
                <p className="mt-1 text-xs text-text-secondary">A new story appears every 30 seconds. Use the arrows to browse at any time.</p>
              </div>
              <div className="flex items-center gap-2">
                {isFetching && <span className="mr-1 shrink-0 text-[10px] font-semibold text-brand">Updating…</span>}
                <button type="button" onClick={showPreviousStory} disabled={items.length < 2} aria-label="Previous news story" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-xl font-semibold text-text shadow-sm transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand disabled:cursor-not-allowed disabled:opacity-40">←</button>
                <span className="min-w-[58px] text-center text-[10px] font-semibold text-text-secondary">{items.length ? (activeIndex % items.length) + 1 : 0} / {items.length}</span>
                <button type="button" onClick={showNextStory} disabled={items.length < 2} aria-label="Next news story" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-xl font-semibold text-text shadow-sm transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand disabled:cursor-not-allowed disabled:opacity-40">→</button>
              </div>
            </div>
            <div className="space-y-4">
              {currentStory && <FeedCard item={currentStory} onOpen={setSelectedStory} featured />}
              {remainingStories.length > 0 && (
                <section className="pt-3">
                  <div className="mb-3 border-t border-border pt-5">
                    <h2 className="text-sm font-bold text-text">All news feeds</h2>
                    <p className="mt-1 text-xs text-text-secondary">All {items.length} available stories are listed here. Open any story without waiting for the 30-second carousel.</p>
                  </div>
                  <div className="space-y-4">
                    {remainingStories.map((item) => <FeedCard key={item.id} item={item} onOpen={setSelectedStory} />)}
                  </div>
                </section>
              )}
            </div>
          </div>
        ) : <div className="p-5 sm:p-7">
<EmptyState />
</div>}
      </section>
      <p className="px-2 py-4 text-[10px] leading-5 text-text-secondary">Stories open in the CollegeBook Reader, which prepares publisher articles for comfortable in-app reading.</p>
      {selectedStory && <StoryModal item={selectedStory} onClose={() => setSelectedStory(null)} />}
    </div>
  );
}

function FeedCard({ item, onOpen, featured = false }) {
  const date = item.publishedAt ? new Date(item.publishedAt) : null;
  return <button type="button" onClick={() => onOpen(item)} className={`group w-full overflow-hidden rounded-2xl border border-border bg-surface text-left transition ${featured ? 'shadow-sm' : ''} hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand/20`}>
    <div className="flex flex-col sm:min-h-[210px] sm:flex-row">
      <div className={`${featured ? 'sm:w-[42%]' : 'sm:w-[34%]'} shrink-0`}>
        {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-48 w-full object-cover sm:h-full sm:min-h-[210px]" loading="lazy" /> : <div className="flex h-40 items-end bg-gradient-to-br from-brand-soft/80 to-bg px-4 pb-3 sm:h-full sm:min-h-[210px]">
<span className="rounded-full bg-surface/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-brand shadow-sm">{labelFor(item.category)}</span>
</div>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 text-[10px] text-text-secondary">
<span className="truncate font-semibold">{item.source || 'News source'}</span>{date && !Number.isNaN(date.getTime()) && <time dateTime={date.toISOString()}>{formatRelative(date)}</time>}</div>
        <h3 className={`${featured ? 'text-lg sm:text-xl' : 'text-base'} mt-2 line-clamp-3 font-bold leading-6 text-text`}>{item.title}</h3>
        {item.description && <p className="mt-2 line-clamp-4 text-xs leading-5 text-text-secondary">{item.description}</p>}
        <span className="mt-4 inline-flex text-[10px] font-bold text-brand">Open in CollegeBook →</span>
      </div>
    </div>
  </button>;
}

function StoryModal({ item, onClose }) {
  const [article, setArticle] = useState(null);
  const [readerError, setReaderError] = useState('');
  const [readerLoading, setReaderLoading] = useState(Boolean(item.url));
  const feedDate = item.publishedAt ? new Date(item.publishedAt) : null;

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      if (!item.url) {
        setReaderError('This feed did not provide a publisher link for the story.');
        setReaderLoading(false);
        return;
      }

      setReaderLoading(true);
      setReaderError('');
      setArticle(null);

      try {
        const result = await newsFeedService.readArticle(item.url);
        if (!cancelled) setArticle(result);
      } catch (error) {
        if (!cancelled) {
          setReaderError(error?.message || 'CollegeBook could not prepare this publisher article for in-app reading.');
        }
      } finally {
        if (!cancelled) setReaderLoading(false);
      }
    }

    loadArticle();
    return () => { cancelled = true; };
  }, [item.url]);

  const articleDate = article?.publishedAt ? new Date(article.publishedAt) : feedDate;
  const validDate = articleDate && !Number.isNaN(articleDate.getTime());

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-1 backdrop-blur-sm sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="news-story-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="flex h-[97dvh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl sm:h-[94vh] sm:rounded-2xl">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand">CollegeBook Reader</p>
            <h2 id="news-story-title" className="mt-0.5 truncate text-sm font-bold text-text sm:text-base">
              {article?.title || item.title}
            </h2>
            <p className="mt-0.5 truncate text-[10px] text-text-secondary sm:text-xs">
              {article?.source || item.source || 'News source'}
              {validDate ? ` · ${formatRelative(articleDate)}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg text-lg text-text-secondary transition hover:bg-brand-soft hover:text-brand" aria-label="Close story">×</button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-surface">
          {readerLoading ? (
            <article className="mx-auto max-w-3xl px-5 pb-12 pt-6 sm:px-8 sm:pt-8">
              {item.imageUrl && <img src={item.imageUrl} alt="" className="mb-7 max-h-[430px] w-full rounded-2xl object-cover" />}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-[10px] font-bold text-brand">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
                Loading full publisher story…
              </div>
              <h1 className="text-2xl font-extrabold leading-tight tracking-[-0.025em] text-text sm:text-3xl">{item.title}</h1>
              {item.description && <p className="mt-4 text-base leading-7 text-text-secondary">{item.description}</p>}
              {item.content && item.content !== item.description && <p className="mt-5 text-[15px] leading-7 text-text sm:text-base sm:leading-8">{item.content}</p>}
            </article>
          ) : readerError ? (
            <div className="flex min-h-full items-center justify-center p-6 text-center">
              <div className="max-w-lg rounded-3xl border border-border bg-bg p-7">
                <div className="text-3xl">📰</div>
                <h3 className="mt-3 text-base font-bold text-text">This article cannot be opened in the in-app reader</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{readerError}</p>
                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-white">Open on publisher website ↗</a>}
              </div>
            </div>
          ) : article ? (
            <article className="mx-auto max-w-3xl px-5 pb-12 pt-6 sm:px-8 sm:pt-8">
              {article.imageUrl && <img src={article.imageUrl} alt="" className="mb-7 max-h-[430px] w-full rounded-2xl object-cover" />}
              <div className="mb-6 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-text-secondary">
                <span className="rounded-full bg-brand-soft px-3 py-1 text-brand">{article.source || item.source}</span>
                {validDate && <time dateTime={articleDate.toISOString()}>{articleDate.toLocaleString()}</time>}
              </div>
              <h1 className="text-2xl font-extrabold leading-tight tracking-[-0.025em] text-text sm:text-3xl">{article.title || item.title}</h1>
              {article.description && <p className="mt-4 border-l-4 border-brand/40 pl-4 text-base leading-7 text-text-secondary">{article.description}</p>}
              <div className="mt-7 space-y-5">
                {(article.paragraphs || []).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 20)}`} className="text-[15px] leading-7 text-text sm:text-base sm:leading-8">{paragraph}</p>)}
              </div>
              <div className="mt-10 border-t border-border pt-5 text-xs leading-5 text-text-secondary">
                CollegeBook Reader reformats publicly available publisher content for easier in-app reading. The story remains attributed to its publisher.
                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-1 font-bold text-brand hover:underline">View original ↗</a>}
              </div>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function LoadingState() { return <div className="p-5 sm:p-7">
<div className="h-72 animate-pulse rounded-2xl bg-bg" />
</div>; }
function EmptyState() { return <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
<div className="text-2xl">📰</div>
<h3 className="mt-3 text-sm font-bold text-text">No stories found</h3>
<p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-text-secondary">Try another category or search term. New approved feeds will appear here automatically.</p>
</div>; }
function labelFor(category) { return CATEGORIES.find((item) => item.id === category)?.label || 'News'; }
function formatRelative(date) { const diff=Date.now()-date.getTime(); const minutes=Math.max(0,Math.floor(diff/60000)); if(minutes<1)return 'just now'; if(minutes<60)return `${minutes}m ago`; const hours=Math.floor(minutes/60); if(hours<24)return `${hours}h ago`; return `${Math.floor(hours/24)}d ago`; }
function SearchIcon(props) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
<circle cx="11" cy="11" r="6.5" />
<path d="m20 20-3.5-3.5" strokeLinecap="round" />
</svg>; }
