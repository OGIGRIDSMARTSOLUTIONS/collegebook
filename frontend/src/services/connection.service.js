import { api } from './api';

export const connectionService = {
  list: () => api.get('/connections'),
  listPending: () => api.get('/connections/pending'),
  send: (studentId) => api.post(`/connections/${studentId}`),
  accept: (studentId) => api.post(`/connections/${studentId}/accept`),
  reject: (studentId) => api.post(`/connections/${studentId}/reject`),
  remove: (studentId) => api.delete(`/connections/${studentId}`),
  block: (studentId) => api.post(`/connections/${studentId}/block`),
};
