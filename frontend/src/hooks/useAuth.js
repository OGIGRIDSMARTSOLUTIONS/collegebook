import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';

/**
 * useAuth — single source of truth for "who is logged in" across the
 * app. On mount, tries GET /auth/me (which itself benefits from the
 * axios interceptor's silent refresh if the access token has expired);
 * a genuine 401 means logged out, not an error to show the user.
 */
export function useAuth() {
  const { context, status, setContext, clearContext } = useAuthStore();
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (meQuery.isSuccess && meQuery.data) {
      setContext(meQuery.data);
    } else if (meQuery.isError) {
      clearContext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meQuery.isSuccess, meQuery.isError, meQuery.data]);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
  });

  const googleLoginMutation = useMutation({
    mutationFn: authService.googleLogin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearContext();
      queryClient.clear();
    },
  });

  return {
    context,
    status: meQuery.isLoading ? 'loading' : status,
    isAuthenticated: status === 'authenticated',
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    loginWithGoogle: googleLoginMutation.mutateAsync,
    googleLoginError: googleLoginMutation.error,
    isLoggingInWithGoogle: googleLoginMutation.isPending,
    register: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutateAsync,
  };
}
