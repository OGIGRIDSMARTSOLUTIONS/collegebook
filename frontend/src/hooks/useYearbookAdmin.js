import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { yearbookService } from '../services/yearbook.service';

export function useAdminYearbooks() {
  return useQuery({ queryKey: ['admin', 'yearbooks'], queryFn: yearbookService.listAdmin });
}

export function useCreateYearbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: yearbookService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'yearbooks'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
    },
  });
}

/** Adds every student of the YearBook's class who isn't listed yet. */
export function useSyncYearbookStudents(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => yearbookService.syncStudents(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'yearbooks'] });
      queryClient.invalidateQueries({ queryKey: ['yearbooks', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
    },
  });
}

export function useYearbookStatusActions(id) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'yearbooks'] });
    queryClient.invalidateQueries({ queryKey: ['yearbooks', id] });
  };
  const publish = useMutation({
    mutationFn: () => yearbookService.publish(id),
    onSuccess: () => { invalidate(); queryClient.invalidateQueries({ queryKey: ['admin', 'students'] }); },
  });
  const archive = useMutation({ mutationFn: () => yearbookService.archive(id), onSuccess: invalidate });
  return { publish, archive };
}

export function useYearbookContentActions(id) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['yearbooks', id] });

  const addSection = useMutation({
    mutationFn: (payload) => yearbookService.addSection(id, payload),
    onSuccess: invalidate,
  });
  const addStudentEntry = useMutation({
    mutationFn: (payload) => yearbookService.addStudentEntry(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['yearbooks', id, 'students'] }),
  });
  const addPhoto = useMutation({
    mutationFn: (payload) => yearbookService.addPhoto(id, payload),
    onSuccess: invalidate,
  });

  return { addSection, addStudentEntry, addPhoto };
}
