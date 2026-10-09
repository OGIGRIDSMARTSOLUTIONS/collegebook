import { api } from './api';

export const reportService = {
  submit: (payload) => api.post('/reports', payload),
  list: (status) => api.get('/reports', { params: status ? { status } : undefined }),
  review: (id, action) => api.post(`/reports/${id}/review`, { action }),
};
