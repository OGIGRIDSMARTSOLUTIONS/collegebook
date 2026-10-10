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
    onSuccess: (createdComment) => {
      // Immediately show the saved total, even while the feed is refetching.
      // Keep other post fields and the current feed pagination intact.
      queryClient.setQueriesData({ queryKey: ['feed'] }, (previous) => {
        if (!previous?.items) return previous;
        return {
          ...previous,
          items: previous.items.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  commentCount: typeof createdComment?.commentCount === 'number'
                    ? createdComment.commentCount
                    : (Number(post.commentCount) || 0) + 1,
                }
              : post
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
