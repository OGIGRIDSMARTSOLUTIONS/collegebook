import { Button } from '../../components/Button';
import { usePendingReports, useReviewReport } from '../../hooks/useReports';
import { LoadingState } from '../../components/loading/Spinner';

export default function AdminModerationPage() {
  const reportsQuery = usePendingReports('PENDING');
  const reviewReport = useReviewReport();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text">Moderation</h1>

      {reportsQuery.isLoading && <LoadingState message="Loading moderation…" />}
      {reportsQuery.data?.length === 0 && <p className="text-sm text-text-secondary">No pending reports.</p>}

      <div className="space-y-3">
        {reportsQuery.data?.map((report) => (
          <div key={report.id} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-medium text-text">
              {report.targetType} reported by {report.reporter?.firstName} {report.reporter?.lastName}
            </p>
            <p className="mt-1 text-sm text-text-secondary">Reason: {report.reason}</p>
            {report.post && <p className="mt-2 rounded-md bg-bg p-2 text-sm text-text">{report.post.body}</p>}
            {report.comment && <p className="mt-2 rounded-md bg-bg p-2 text-sm text-text">{report.comment.body}</p>}
            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => reviewReport.mutate({ id: report.id, action: 'DISMISS' })}
                disabled={reviewReport.isPending}
              >
                Dismiss
              </Button>
              <Button
                variant="ghost"
                className="text-danger"
                onClick={() => reviewReport.mutate({ id: report.id, action: 'ACTION' })}
                disabled={reviewReport.isPending}
              >
                Take action (hide content)
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}