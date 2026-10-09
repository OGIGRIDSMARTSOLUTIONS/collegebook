import { api } from './api';
export const birthdayService = { list: (days = 14) => api.get('/birthdays', { params: { days } }) };
