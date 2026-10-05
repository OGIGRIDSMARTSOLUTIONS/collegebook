import { useProfile } from '../../hooks/useProfile';
import { useInstitutionDashboard, useUpdateInstitutionBranding } from '../../hooks/useInstitutionAdmin';
import { ImageDropzone } from '../../components/ImageDropzone';
import { Button } from '../../components/Button';
import { LoadingState } from '../../components/loading/Spinner';

const STAT_LABELS = {
  students: 'Students',
  activeStudents: 'Active students',
  sets: 'Classes',
  departments: 'Departments',
  broadcasts: 'Broadcasts sent',
  yearBooks: 'YearBooks',
};

function InstitutionBranding() {
  const { data: profile } = useProfile();
  const updateBranding = useUpdateInstitutionBranding();
  const institution = profile?.institution;

  if (!institution) return null;

  function saveLogo(url) {
    updateBranding.mutate({ logoUrl: url });
  }

  return (
    <section className="rounded-2xl border border-[#d9c7a9] bg-[#f8f2e8] p-5 shadow-[0_8px_30px_rgba(75,55,25,0.05)] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yearbook">Institution identity</p>
          <h2 className="yearbook-serif mt-1 text-2xl font-bold text-yearbook-ink">Your official logo</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[#6c5c43]">
            This logo represents your institution throughout CollegeBook. It appears on student profiles,
            YearBook pages and other institution-facing experiences.
          </p>
        </div>
        <div className="sm:ml-auto sm:w-36">
          <ImageDropzone
            purpose="institution-logo"
            shape="square"
            currentUrl={institution.logoUrl}
            onUploaded={saveLogo}
            className="h-28 w-28 sm:h-32 sm:w-32"
          />
        </div>
      </div>
      {updateBranding.isPending && <p className="mt-3 text-xs text-text-secondary">Saving institution branding…</p>}
      {updateBranding.isError && <p className="mt-3 text-xs text-danger">{updateBranding.error.message}</p>}
      {updateBranding.isSuccess && <p className="mt-3 text-xs font-medium text-success">Institution logo updated.</p>}
    </section>
  );
}

export default function AdminDashboardPage() {
  const dashboardQuery = useInstitutionDashboard();
  const { data: profile } = useProfile();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Institution administration</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-text sm:text-3xl">
          {profile?.institution?.name || 'Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your institution, students, YearBooks and community.</p>
      </div>

      <InstitutionBranding />

      {dashboardQuery.isLoading && <LoadingState message="Loading dashboard…" />}

      {dashboardQuery.data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(STAT_LABELS).map(([key, label]) => (
            <div key={key} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <p className="text-2xl font-semibold text-text">{dashboardQuery.data[key] ?? 0}</p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}