import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '../services/group.service';

export function useGroups() {
  return useQuery({ queryKey: ['groups'], queryFn: groupService.list });
}

export function useGroup(id) {
  return useQuery({ queryKey: ['groups', id], queryFn: () => groupService.getById(id), enabled: !!id });
}

export function useGroupMembers(id) {
  return useQuery({ queryKey: ['groups', id, 'members'], queryFn: () => groupService.listMembers(id), enabled: !!id });
}

export function useGroupPosts(id) {
  return useQuery({ queryKey: ['groups', id, 'posts'], queryFn: () => groupService.listPosts(id), enabled: !!id });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useCreateGroupPost(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => groupService.createPost(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups', id, 'posts'] }),
  });
}

export function useGroupMembership(id) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['groups', id] });
    queryClient.invalidateQueries({ queryKey: ['groups', id, 'members'] });
  };
  const join = useMutation({ mutationFn: () => groupService.join(id), onSuccess: invalidate });
  const leave = useMutation({ mutationFn: () => groupService.leave(id), onSuccess: invalidate });
  return { join, leave };
}

export function useGroupMemberActions(id) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['groups', id, 'members'] });
  const addMember = useMutation({ mutationFn: (studentId) => groupService.addMember(id, studentId), onSuccess: invalidate });
  const removeMember = useMutation({ mutationFn: (studentId) => groupService.removeMember(id, studentId), onSuccess: invalidate });
  const updateRole = useMutation({
    mutationFn: ({ studentId, role }) => groupService.updateMemberRole(id, studentId, role),
    onSuccess: invalidate,
  });
  return { addMember, removeMember, updateRole };
}
