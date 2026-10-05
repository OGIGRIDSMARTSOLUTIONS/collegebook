import { api } from './api';

export const authService = {
  register: (payload) => api.post('/auth/register', payload),
  // Matric number in, that student's school departments out.
  registrationDepartments: (matriculationNumber) => api.post('/auth/registration-departments', { matriculationNumber }),
  login: (payload) => api.post('/auth/login', payload),
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};
