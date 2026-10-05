import { api } from './api';
export const eventService = {
  list: (params) => api.get('/events', { params }),
  listAdmin: () => api.get('/events/admin'),
  create: (payload) => api.post('/events', payload),
  update: (id, payload) => api.patch(`/events/${id}`, payload),
  remove: (id) => api.delete(`/events/${id}`),
};
