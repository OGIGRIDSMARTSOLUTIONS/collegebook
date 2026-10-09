import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import { ThemeProvider } from './theme/ThemeContext';
import App from './App.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 45 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      placeholderData: (previousData) => previousData,
    },
    mutations: { retry: 0 },
  },
});

// Google Sign-In is optional, same pattern as Redis on the backend: if
// VITE_GOOGLE_CLIENT_ID isn't set, we simply don't wrap the app in
// GoogleOAuthProvider at all, and the LoginPage's Google button doesn't
// render — no broken half-configured OAuth state, no console errors from
// handing the provider an empty client id.
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const tree = (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
<App />
</ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>{googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider> : tree}</StrictMode>
);
