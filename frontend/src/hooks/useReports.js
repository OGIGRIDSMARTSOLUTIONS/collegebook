import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../services/report.service';

export function useSubmitReport() {
  return useMutation({ mutationFn: reportService.submit });
}

// Admin-facing — used by the moderation panel, not the student UI.
export function usePendingReports(status) {
  return useQuery({ queryKey: ['reports', status], queryFn: () => reportService.list(status) });
}

export function useReviewReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }) => reportService.review(id, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });
}
