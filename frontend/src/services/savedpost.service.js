import { api } from './api';

export const savedPostService = {
  list: () => api.get('/saved-posts'),
  save: (postId) => api.post(`/saved-posts/${postId}`),
  unsave: (postId) => api.delete(`/saved-posts/${postId}`),
};
