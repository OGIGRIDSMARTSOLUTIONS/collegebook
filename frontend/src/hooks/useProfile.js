import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../services/student.service';
import { useAuthStore } from '../store/authStore';

export function useProfile() {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: studentService.getMe,
    enabled: status === 'authenticated',
    staleTime: 60 * 1000,
  });
}

export function useStudentProfile(id) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentService.updateMe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }),
  });
}
