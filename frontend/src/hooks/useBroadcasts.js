import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { broadcastService } from '../services/broadcast.service';

export function useSentBroadcasts(params) {
  return useQuery({ queryKey: ['broadcasts', 'sent', params], queryFn: () => broadcastService.listSent(params) });
}

export function useMyBroadcasts(params) {
  return useQuery({ queryKey: ['broadcasts', 'mine', params], queryFn: () => broadcastService.listMine(params) });
}

export function useMarkBroadcastRead() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: broadcastService.markRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broadcasts', 'mine'] }) });
}

export function useCreateBroadcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: broadcastService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broadcasts', 'sent'] }),
  });
}
