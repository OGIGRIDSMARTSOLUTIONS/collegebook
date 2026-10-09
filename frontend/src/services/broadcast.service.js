import { api } from './api';

export const broadcastService = {
  create: (payload) => api.post('/broadcasts', payload),
  listSent: (params) => api.get('/broadcasts/sent', { params }),
  listMine: (params) => api.get('/broadcasts/me', { params }),
  markRead: (id) => api.post(`/broadcasts/${id}/read`),
};
