import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  if (!match) return null;
  const raw = match[1] ?? '';
  return decodeURIComponent(raw);
}

apiClient.interceptors.request.use((config) => {
  // Backward compat: still send Bearer if present (migration period)
  const token = localStorage.getItem('id_token');
  if (token) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const csrf = getCsrfToken();
  if (csrf) {
    (config.headers as Record<string, string>)['X-CSRF-Token'] = csrf;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('id_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Cleanup legacy localStorage token on load (migration to httpOnly cookie)
if (typeof window !== 'undefined' && localStorage.getItem('id_token')) {
  // Keep for fallback until logout, but warn
  console.warn('[auth] Legacy localStorage token detected - will be migrated to httpOnly cookie on next login');
}
