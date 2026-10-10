import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '../services/post.service';

export function useComments(postId, enabled) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => postService.getComments(postId),
    enabled: !!postId && enabled,
  });
}

export function useAddComment(postId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => postService.comment(postId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      // Refresh the feed's comment totals after adding a comment.
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
