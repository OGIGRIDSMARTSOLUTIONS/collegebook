import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { institutionService } from '../services/institution.service';

export function useAllInstitutions() {
  return useQuery({ queryKey: ['super-admin', 'institutions'], queryFn: institutionService.listAll });
}

export function useCreateInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: institutionService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin', 'institutions'] }),
  });
}


export function useCreateInstitutionAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ institutionId, payload }) => institutionService.createAdmin(institutionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin', 'institutions'] }),
  });
}
