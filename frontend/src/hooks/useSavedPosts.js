import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { savedPostService } from '../services/savedpost.service';

export function useSavedPosts() {
  return useQuery({ queryKey: ['saved-posts'], queryFn: savedPostService.list });
}

export function useToggleSavedPost() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
  const save = useMutation({ mutationFn: savedPostService.save, onSuccess: invalidate });
  const unsave = useMutation({ mutationFn: savedPostService.unsave, onSuccess: invalidate });
  return { save, unsave };
}
