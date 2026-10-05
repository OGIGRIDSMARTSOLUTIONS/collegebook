import { io } from 'socket.io-client';

// Same host as the REST API, just without the /api suffix — the backend
// mounts Socket.IO directly on the HTTP server, not under /api.
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '');

let socket = null;

/**
 * getSocket — a single shared connection for the whole app, created lazily
 * and reused everywhere. Authenticates via the same httpOnly accessToken
 * cookie as every REST call (withCredentials: true), matching the
 * backend's cookie-parsing handshake in src/websocket/socket.js — there is
 * no separate token to manage on the frontend for this either.
 */
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
