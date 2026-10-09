import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../services/student.service';

export function useAdminStudentSearch(params) {
  return useQuery({
    queryKey: ['admin', 'students', params],
    queryFn: () => studentService.adminSearch(params),
    enabled: !!params,
  });
}

export function useAdminCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => studentService.adminCreate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useAdminUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => studentService.adminUpdate(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'students'] }),
  });
}


export function useAdminBulkAnalyze() {
  return useMutation({ mutationFn: (csv) => studentService.adminBulkAnalyze(csv) });
}

export function useAdminBulkImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (csv) => studentService.adminBulkImport(csv),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}
