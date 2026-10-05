import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useYearbooks, useYearbook, useYearbookStudents } from '../../hooks/useYearbook';
import { DotWaveField } from '../../components/DotWaveField';
import { LoadingState, PageLoader } from '../../components/loading/Spinner';

function initials(firstName, lastName) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

function BookIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19a2.5 2.5 0 0 1 2.5-2.5H20M8 7h8M8 10h6" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptyYearbooks() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yearbook-soft text-yearbook">
        <BookIcon className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-text">Your institution’s archive is getting ready</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
        Published YearBooks will appear here as permanent digital records of each graduating class.
      </p>
    </div>
  );
}

function YearbookCard({ yearbook, onSelect, featured = false }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(yearbook.id)}
      className={`group overflow-hidden rounded-3xl border border-border bg-surface text-left shadow-[0_8px_30px_rgba(20,40,45,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-yearbook/40 hover:shadow-[0_16px_40px_rgba(20,40,45,0.09)] ${
        featured ? 'md:col-span-2' : ''
      }`}
    >
      <div className={`relative overflow-hidden bg-[#e9dfcf] ${featured ? 'h-72 md:h-80' : 'h-52'}`}>
        {yearbook.coverImageUrl ? (
          <img
            src={yearbook.coverImageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f7f0e3] via-[#eee4d3] to-[#d9c6a6]">
            <div className="text-center text-yearbook-ink">
              <BookIcon className="mx-auto h-12 w-12 opacity-70" />
              <p className="yearbook-serif mt-3 text-3xl font-bold">{yearbook.year}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] opacity-70">CollegeBook Archive</p>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5 pt-16">
          <span className="inline-flex rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-yearbook">
            Official YearBook
          </span>
        </div>
      </div>
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-yearbook">Graduating class</p>
            <h2 className="yearbook-serif mt-1 text-2xl font-bold text-text">{yearbook.year}</h2>
          </div>
          <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary transition group-hover:border-yearbook group-hover:text-yearbook">
            <ArrowIcon />
          </span>
        </div>
        {yearbook.welcomeMessage && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-text-secondary">{yearbook.welcomeMessage}</p>
        )}
      </div>
    </button>
  );
}

function YearbookDetail({ yearbookId, onBack }) {
  const yearbookQuery = useYearbook(yearbookId);
  const studentsQuery = useYearbookStudents(yearbookId);
  const [query, setQuery] = useState('');

  const students = studentsQuery.data ?? [];
  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((entry) => {
      const name = `${entry.student?.firstName ?? ''} ${entry.student?.lastName ?? ''}`.toLowerCase();
      const set = entry.student?.academicSet?.name?.toLowerCase() ?? '';
      return name.includes(q) || set.includes(q);
    });
  }, [students, query]);

  if (yearbookQuery.isLoading) {
    return <PageLoader message="Loading YearBook…" />;
  }

  if (yearbookQuery.isError || !yearbookQuery.data) {
    return (
      <div className="mx-auto max-w-5xl py-16 text-center">
        <p className="text-sm text-danger">Couldn’t load this YearBook.</p>
        <button onClick={onBack} className="mt-3 text-sm font-semibold text-brand">Return to archive</button>
      </div>
    );
  }

  const yb = yearbookQuery.data;
  const sectionCount = yb.sections?.length ?? 0;

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden">
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text"
      >
        ← Back to archive
      </button>

      <section className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_16px_50px_rgba(20,40,45,0.08)]">
        <div className="relative min-w-0 h-64 bg-[#e9dfcf] md:h-[360px]">
          {yb.coverImageUrl ? (
            <img src={yb.coverImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f7f0e3] via-[#eee4d3] to-[#d1ba91]">
              <div className="text-center text-yearbook-ink">
                <BookIcon className="mx-auto h-14 w-14 opacity-70" />
                <p className="yearbook-serif mt-4 text-5xl font-bold">{yb.year}</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
          <div className="absolute bottom-0 left-0 min-w-0 max-w-full p-6 text-white md:p-9">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">Official digital archive</p>
            <h1 className="yearbook-serif mt-1 break-words text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">YearBook · {yb.year}</h1>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_auto]">
          <div className="p-6 md:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-yearbook">A record to keep</p>
            {yb.welcomeMessage ? (
              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-[15px] leading-7 text-text-secondary">
                {yb.welcomeMessage}
              </p>
            ) : (
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-text-secondary">
                A permanent digital record of the students, memories and milestones of this graduating class.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 border-t border-border md:border-l md:border-t-0">
            <div className="px-6 py-5 md:min-w-36">
              <p className="text-2xl font-bold text-text">{students.length}</p>
              <p className="mt-1 text-xs text-text-secondary">Graduates</p>
            </div>
            <div className="border-l border-border px-6 py-5 md:min-w-36">
              <p className="text-2xl font-bold text-text">{sectionCount}</p>
              <p className="mt-1 text-xs text-text-secondary">Sections</p>
            </div>
          </div>
        </div>
      </section>

      {yb.sections?.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-text-secondary">Archive sections</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {yb.sections
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <span key={section.id} className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text">
                  {section.title}
                </span>
              ))}
          </div>
        </section>
      )}

      <section className="mt-9">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-yearbook">The graduating class</p>
            <h2 className="yearbook-serif mt-1 text-3xl font-bold text-text">Student Directory</h2>
            <p className="mt-1 text-sm text-text-secondary">Browse the official record of this class.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search graduates"
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-text-secondary focus:border-yearbook"
            />
          </div>
        </div>

        {studentsQuery.isLoading && <LoadingState message="Loading graduate directory…" compact />}
        {!studentsQuery.isLoading && filteredStudents.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-text-secondary">
            {query ? `No graduates match “${query}”.` : 'No students have been added to this YearBook yet.'}
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((entry) => (
            <Link
              key={entry.id}
              to={`/profile/${entry.student?.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-yearbook/40 hover:shadow-md"
            >
              <div className="relative shrink-0">
                {entry.photoUrl || entry.student?.profilePhotoUrl ? (
                  <img
                    src={entry.photoUrl || entry.student?.profilePhotoUrl}
                    alt=""
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yearbook-soft text-sm font-bold text-yearbook">
                    {initials(entry.student?.firstName, entry.student?.lastName)}
                  </span>
                )}
                {entry.student?.institution?.logoUrl && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center overflow-hidden rounded-md border border-white bg-white p-0.5 shadow-sm">
                    <img src={entry.student.institution.logoUrl} alt="" className="h-full w-full object-contain" />
                  </span>
                )}
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-text">
                  {entry.student?.firstName} {entry.student?.lastName}
                </span>
                <span className="mt-1 block truncate text-xs text-text-secondary">
                  {entry.student?.academicSet?.name || 'Graduating class'}
                </span>
                {entry.quote && (
                  <span className="mt-1 block truncate text-xs italic text-text-secondary">“{entry.quote}”</span>
                )}
              </span>
              <ArrowIcon />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function YearbookPage() {
  const [selectedId, setSelectedId] = useState(null);
  const { data: profile } = useProfile();
  const yearbooksQuery = useYearbooks();

  if (selectedId) {
    return <YearbookDetail yearbookId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  const yearbooks = yearbooksQuery.data ?? [];
  const latest = yearbooks[0];
  const previous = yearbooks.slice(1);

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#d9c7a9] bg-[#f8f2e8] shadow-[0_16px_50px_rgba(75,55,25,0.08)]">
        <DotWaveField
          className="z-0"
          color="rgba(154,116,53,0.85)"
          density="normal"
          opacity={0.55}
          dotSize={1.15}
          waveStrength={0.82}
        />
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#eadbbf]/60 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-white/70 blur-3xl" />
        <div className="relative z-10 grid min-w-0 gap-8 p-7 md:grid-cols-[1.35fr_.65fr] md:p-11">
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#d8c6a5] bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-yearbook">
              <BookIcon className="h-3.5 w-3.5" />
              Institutional archive
            </div>
            <h1 className="yearbook-serif mt-5 max-w-2xl break-words text-[2.25rem] font-bold leading-[1.02] tracking-[-0.03em] text-yearbook-ink sm:text-5xl md:text-6xl">
              Your institution’s story, preserved.
            </h1>
            <p className="mt-4 max-w-2xl break-words text-[15px] leading-7 text-[#6c5c43] md:text-base">
              The CollegeBook YearBook is the official digital record of graduating classes—students, memories,
              milestones and the people who made each year unforgettable.
            </p>
            {profile?.institution?.name && (
              <div className="mt-5 inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-[#d8c6a5] bg-white/70 px-3 py-1.5 text-sm font-semibold text-yearbook-ink">
                {profile.institution.logoUrl && (
                  <img src={profile.institution.logoUrl} alt="" className="h-6 w-6 object-contain" />
                )}
                <span className="min-w-0 break-words whitespace-normal">
                  {profile.institution.name}
                  {profile.institution.shortName ? ` · ${profile.institution.shortName}` : ''}
                </span>
              </div>
            )}
          </div>
          <div className="hidden items-center justify-center md:flex">
            <div className="relative h-52 w-40 rotate-[-4deg] rounded-[4px] bg-white p-2 shadow-2xl">
              <div className="flex h-full flex-col items-center justify-center border border-[#d9c7a9] bg-gradient-to-br from-[#f7f0e3] to-[#e5d3b4] text-center text-yearbook-ink">
                <BookIcon className="h-10 w-10 opacity-60" />
                <p className="yearbook-serif mt-3 text-3xl font-bold">{latest?.year || '20XX'}</p>
                <p className="mt-1 px-4 text-[8px] font-bold uppercase tracking-[0.22em] opacity-70">YearBook</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-9 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-yearbook">Explore the archive</p>
          <h2 className="yearbook-serif mt-1 text-3xl font-bold text-text">YearBooks</h2>
        </div>
        <p className="hidden text-sm text-text-secondary sm:block">
          {yearbooks.length} published {yearbooks.length === 1 ? 'edition' : 'editions'}
        </p>
      </div>

      {yearbooksQuery.isLoading && <LoadingState message="Loading your institution’s archive…" compact />}
      {yearbooksQuery.isError && <p className="mt-6 text-sm text-danger">Couldn’t load the YearBook archive.</p>}
      {!yearbooksQuery.isLoading && !yearbooksQuery.isError && yearbooks.length === 0 && (
        <div className="mt-5"><EmptyYearbooks /></div>
      )}

      {latest && (
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <YearbookCard yearbook={latest} onSelect={setSelectedId} featured />
          {previous.slice(0, 2).map((yb) => (
            <YearbookCard key={yb.id} yearbook={yb} onSelect={setSelectedId} />
          ))}
        </div>
      )}

      {previous.length > 2 && (
        <section className="mt-8">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-text-secondary">More editions</h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {previous.slice(2).map((yb) => (
              <YearbookCard key={yb.id} yearbook={yb} onSelect={setSelectedId} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 border-t border-border pt-6 text-center text-xs leading-5 text-text-secondary">
        <p>YearBook records are published and managed by your institution.</p>
        <p className="mt-1">CollegeBook combines institutional memory with a private social space for students.</p>
      </div>
    </div>
  );
}