import { api } from './api';

export const yearbookService = {
  listMine: () => api.get('/yearbooks/me'),
  getById: (id) => api.get(`/yearbooks/${id}`),
  listStudents: (id) => api.get(`/yearbooks/${id}/students`),

  // Admin
  listAdmin: () => api.get('/yearbooks/admin'),
  create: (payload) => api.post('/yearbooks', payload),
  publish: (id) => api.post(`/yearbooks/${id}/publish`),
  archive: (id) => api.post(`/yearbooks/${id}/archive`),
  addSection: (id, payload) => api.post(`/yearbooks/${id}/sections`, payload),
  addStudentEntry: (id, payload) => api.post(`/yearbooks/${id}/students`, payload),
  addPhoto: (id, payload) => api.post(`/yearbooks/${id}/photos`, payload),
  addContent: (sectionId, payload) => api.post(`/yearbooks/sections/${sectionId}/contents`, payload),
};
