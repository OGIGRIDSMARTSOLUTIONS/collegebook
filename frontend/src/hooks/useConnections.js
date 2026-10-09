import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionService } from '../services/connection.service';

export function useConnections() {
  return useQuery({ queryKey: ['connections'], queryFn: connectionService.list });
}

export function usePendingConnections() {
  return useQuery({ queryKey: ['connections', 'pending'], queryFn: connectionService.listPending });
}

export function useConnectionActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['connections'] });

  const send = useMutation({ mutationFn: connectionService.send, onSuccess: invalidate });
  const accept = useMutation({ mutationFn: connectionService.accept, onSuccess: invalidate });
  const reject = useMutation({ mutationFn: connectionService.reject, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: connectionService.remove, onSuccess: invalidate });
  const block = useMutation({ mutationFn: connectionService.block, onSuccess: invalidate });

  return { send, accept, reject, remove, block };
}
