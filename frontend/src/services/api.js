import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send/receive the httpOnly accessToken/refreshToken cookies
});

// Every backend response is { success, data } or { success: false, message,
// details }. Unwrap `data` here so the rest of the app just works with
// plain values instead of reaching into response.data.data everywhere.
api.interceptors.response.use(
  (response) => response.data?.data,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    // Silent refresh: a 401 on anything other than the auth endpoints
    // themselves gets one retry after refreshing the access token. This
    // is what makes the 15-minute access token invisible to the user in
    // normal use — only a truly expired *refresh* token (or no session at
    // all) surfaces as a real "logged out" state.
    const isAuthRoute = original?.url?.startsWith('/auth/');
    if (status === 401 && !isAuthRoute && !original._retried) {
      original._retried = true;
      try {
        await api.post('/auth/refresh');
        return api(original);
      } catch {
        // Refresh itself failed — genuinely logged out. Let the caller's
        // own error handling (or the ProtectedRoute redirect) take it
        // from here rather than forcing a hard redirect from inside the
        // API client.
      }
    }

    return Promise.reject({ status, message, details: error.response?.data?.details });
  }
);
