import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { institutionService } from '../../services/institution.service';
import { useYearbooks, useYearbook } from '../../hooks/useYearbook';
import { LoadingState } from '../../components/loading/Spinner';

const views = {
  students: { title: 'Students', description: 'Discover students through CollegeBook Network.', icon: '👥' },
  faculties: { title: 'Faculties', description: 'Academic faculties and departments in your institution.', icon: '🏛️' },
  photos: { title: 'Gallery & Memories', description: 'Published YearBook photographs and institutional memories.', icon: '🖼️' },
  achievements: { title: 'Class Achievements', description: 'Published accomplishments recorded in your institution’s YearBooks.', icon: '🏆' },
};

function Header({ meta }) {
  return <header className="rounded-3xl border border-border bg-surface p-6 shadow-sm"><div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-2xl">{meta.icon}</span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">My Institution</p><h1 className="mt-1 text-3xl font-black text-text">{meta.title}</h1><p className="mt-1 text-sm text-text-secondary">{meta.description}</p></div></div></header>;
}

function YearbookMedia({ yearbook, mode }) {
  const detail = useYearbook(yearbook.id);
  if (detail.isLoading || !detail.data) return null;
  const data = detail.data;
  if (mode === 'photos') return (data.photos || []).map((photo) => <article key={photo.id} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"><img src={photo.url} alt={photo.caption || ''} loading="lazy" decoding="async" className="aspect-[5/4] w-full object-cover" /><div className="p-3"><p className="text-xs font-bold text-text">{yearbook.year} YearBook</p>{photo.caption && <p className="mt-1 text-xs text-text-secondary">{photo.caption}</p>}</div></article>);
  return (data.sections || []).filter((s) => s.kind === 'ACHIEVEMENTS').map((section) => <article key={section.id} className="rounded-2xl border border-[#d8bd69] bg-gradient-to-br from-[#fffdf5] to-[#f8f0d5] p-5 shadow-sm"><span className="text-2xl">🏆</span><p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[#9a7415]">{yearbook.year} YearBook</p><h3 className="mt-1 text-lg font-black text-[#0b2a5b]">{section.title}</h3><p className="mt-2 text-sm text-text-secondary">Official class achievement recorded by the institution.</p></article>);
}

export default function InstitutionExplorePage() {
  const [params] = useSearchParams();
  const requested = params.get('view');
  const view = views[requested] ? requested : 'faculties';
  const meta = views[view];
  const faculties = useQuery({ queryKey: ['institution', 'faculties'], queryFn: institutionService.listFaculties, enabled: view === 'faculties' });
  const departments = useQuery({ queryKey: ['institution', 'departments'], queryFn: institutionService.listDepartments, enabled: view === 'faculties' });
  const yearbooks = useYearbooks();
  const grouped = useMemo(() => (departments.data || []).reduce((acc, d) => { const key = d.faculty?.id || 'other'; (acc[key] ||= []).push(d); return acc; }, {}), [departments.data]);

  if (view === 'students') return <div className="mx-auto max-w-5xl"><Header meta={meta} /><div className="mt-6 rounded-3xl border border-border bg-surface p-8 text-center"><p className="text-text-secondary">Use My Network to discover students, classmates and connections while respecting profile privacy.</p><Link to="/network" className="mt-5 inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white">Open Student Network</Link></div></div>;

  return <div className="mx-auto max-w-6xl"><Header meta={meta} />
    {view === 'faculties' && <div className="mt-6 grid gap-4 md:grid-cols-2">{faculties.isLoading ? <LoadingState message="Loading faculties…" compact /> : (faculties.data || []).map((faculty) => <article key={faculty.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-xl">🏛️</span><div><h2 className="font-black text-text">{faculty.name}</h2><p className="text-xs text-text-secondary">{(grouped[faculty.id] || []).length} departments</p></div></div><div className="mt-4 flex flex-wrap gap-2">{(grouped[faculty.id] || []).map((d) => <span key={d.id} className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs text-text-secondary">{d.name}</span>)}</div></article>)}</div>}
    {(view === 'photos' || view === 'achievements') && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{yearbooks.isLoading ? <LoadingState message="Loading YearBook records…" compact /> : (yearbooks.data || []).map((y) => <YearbookMedia key={y.id} yearbook={y} mode={view} />)}</div>}
  </div>;
}
