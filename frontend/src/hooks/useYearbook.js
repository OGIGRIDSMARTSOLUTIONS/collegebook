import { useQuery } from '@tanstack/react-query';
import { yearbookService } from '../services/yearbook.service';

export function useYearbooks() {
  return useQuery({ queryKey: ['yearbooks'], queryFn: yearbookService.listMine });
}

export function useYearbook(id) {
  return useQuery({
    queryKey: ['yearbooks', id],
    queryFn: () => yearbookService.getById(id),
    enabled: !!id,
  });
}

export function useYearbookStudents(id) {
  return useQuery({
    queryKey: ['yearbooks', id, 'students'],
    queryFn: () => yearbookService.listStudents(id),
    enabled: !!id,
  });
}
