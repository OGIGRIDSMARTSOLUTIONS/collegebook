import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { privacyService } from '../services/privacy.service';

export function usePrivacySettings() {
  return useQuery({ queryKey: ['privacy', 'me'], queryFn: privacyService.getMine });
}

export function useUpdatePrivacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: privacyService.update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['privacy', 'me'] }),
  });
}
