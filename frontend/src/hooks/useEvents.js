import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../services/event.service';
export function useEvents(params) { return useQuery({ queryKey: ['events', params], queryFn: () => eventService.list(params), staleTime: 5 * 60 * 1000 }); }
export function useAdminEvents() { return useQuery({ queryKey: ['events', 'admin'], queryFn: eventService.listAdmin }); }
export function useEventActions() {
  const qc = useQueryClient();
  const refresh = () => { qc.invalidateQueries({ queryKey: ['events'] }); };
  return {
    create: useMutation({ mutationFn: eventService.create, onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, payload }) => eventService.update(id, payload), onSuccess: refresh }),
    remove: useMutation({ mutationFn: eventService.remove, onSuccess: refresh }),
  };
}
