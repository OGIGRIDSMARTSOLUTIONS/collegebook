import { create } from 'zustand';

/**
 * Holds the server-derived auth context (the same shape as backend
 * req.context: userId, role, studentId, institutionId, setId, etc.) —
 * never anything the frontend invents itself. Populated from GET
 * /auth/me on load and after login; cleared on logout.
 */
export const useAuthStore = create((set) => ({
  context: null,
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'

  setContext: (context) => set({ context, status: 'authenticated' }),
  clearContext: () => set({ context: null, status: 'unauthenticated' }),
}));
