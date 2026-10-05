import { api } from './api';

export const privacyService = {
  getMine: () => api.get('/privacy/me'),
  update: (payload) => api.patch('/privacy/me', payload),
};
