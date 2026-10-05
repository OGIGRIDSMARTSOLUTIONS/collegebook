import { api } from './api';

export const uploadService = {
  upload: (file, purpose) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);
    return api.post('/uploads', formData);
  },
};
