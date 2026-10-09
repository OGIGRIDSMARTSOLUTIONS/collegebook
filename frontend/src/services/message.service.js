import { api } from './api';

export const messageService = {
  listConversations: () => api.get('/messages/conversations'),
  startConversation: (studentId) => api.post(`/messages/conversations/${studentId}`),
  getMessages: (conversationId, params) => api.get(`/messages/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, payload) => api.post(`/messages/conversations/${conversationId}/messages`, payload),
  markRead: (conversationId) => api.post(`/messages/conversations/${conversationId}/read`),
};
