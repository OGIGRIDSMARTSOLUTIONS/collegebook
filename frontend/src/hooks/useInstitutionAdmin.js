import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { institutionService } from '../services/institution.service';

export function useInstitutionDashboard() {
  return useQuery({ queryKey: ['admin', 'dashboard'], queryFn: institutionService.getDashboard });
}

export function useFaculties() {
  return useQuery({ queryKey: ['admin', 'faculties'], queryFn: institutionService.listFaculties });
}

export function useDepartments() {
  return useQuery({ queryKey: ['admin', 'departments'], queryFn: institutionService.listDepartments });
}

export function useAcademicSets() {
  return useQuery({ queryKey: ['admin', 'academic-sets'], queryFn: institutionService.listAcademicSets });
}

export function useUpdateInstitutionBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: institutionService.updateBranding,
    onSuccess: (institution) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
      queryClient.setQueryData(['admin', 'institution-branding'], institution);
    },
  });
}

export function useCreateFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: institutionService.createFaculty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'faculties'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}


export function useUpdateFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }) => institutionService.updateFaculty(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'faculties'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: institutionService.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}


export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }) => institutionService.updateDepartment(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
    },
  });
}

export function useCreateAcademicSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: institutionService.createAcademicSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'academic-sets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}
