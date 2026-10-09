import { api } from './api';

export const studentService = {
  getMe: () => api.get('/students/me'),
  updateMe: (payload) => api.patch('/students/me', payload),
  getById: (id) => api.get(`/students/${id}`),
  search: (params) => api.get('/students/search', { params }),
  adminSearch: (params) => api.get('/students/admin-search', { params }),
  adminCreate: (payload) => api.post('/students/admin', payload),
  adminUpdate: (id, payload) => api.patch(`/students/${id}`, payload),
  adminBulkAnalyze: (csv) => api.post('/students/admin/bulk-analyze', { csv }),
  adminBulkImport: (csv) => api.post('/students/admin/bulk-import', { csv }),
};
