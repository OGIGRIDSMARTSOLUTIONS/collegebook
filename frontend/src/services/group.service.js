import { api } from './api';

export const groupService = {
  list: () => api.get('/groups'),
  create: (payload) => api.post('/groups', payload),
  getById: (id) => api.get(`/groups/${id}`),
  listMembers: (id) => api.get(`/groups/${id}/members`),
  listPosts: (id) => api.get(`/groups/${id}/posts`),
  createPost: (id, payload) => api.post(`/groups/${id}/posts`, payload),
  join: (id) => api.post(`/groups/${id}/join`),
  leave: (id) => api.post(`/groups/${id}/leave`),
  addMember: (id, studentId) => api.post(`/groups/${id}/members/${studentId}`),
  removeMember: (id, studentId) => api.delete(`/groups/${id}/members/${studentId}`),
  updateMemberRole: (id, studentId, role) => api.patch(`/groups/${id}/members/${studentId}`, { role }),
};
