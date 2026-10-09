import { api } from './api';

export const institutionService = {
  getDashboard: () => api.get('/institutions/me/dashboard'),
  updateBranding: (payload) => api.patch('/institutions/me/branding', payload),
  listFaculties: () => api.get('/institutions/me/faculties'),
  listDepartments: () => api.get('/institutions/me/departments'),
  listAcademicSets: () => api.get('/institutions/me/academic-sets'),
  createFaculty: (payload) => api.post('/institutions/me/faculties', payload),
  updateFaculty: (id, payload) => api.patch(`/institutions/me/faculties/${id}`, payload),
  createDepartment: (payload) => api.post('/institutions/me/departments', payload),
  updateDepartment: (id, payload) => api.patch(`/institutions/me/departments/${id}`, payload),
  createAcademicSet: (payload) => api.post('/institutions/me/academic-sets', payload),
  // Platform-level — SUPER_ADMIN only.
  listAll: () => api.get('/institutions'),
  create: (payload) => api.post('/institutions', payload),
  createAdmin: (institutionId, payload) => api.post(`/institutions/${institutionId}/admin`, payload),
};
