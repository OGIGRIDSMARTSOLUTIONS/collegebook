import { api } from './api';

export const postService = {
  getFeed: (params) => api.get('/posts/feed', { params }),
  create: (payload) => api.post('/posts', payload),
  react: (postId, type) => api.post(`/posts/${postId}/reactions`, { type }),
  comment: (postId, payload) => api.post(`/posts/${postId}/comments`, payload),
  getComments: (postId) => api.get(`/posts/${postId}/comments`),
};
