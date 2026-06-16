import axios from 'axios';

/**
 * Configured Axios instance for API calls.
 * - Base URL from environment variable
 * - Credentials included for cookie-based auth
 * - Authorization header with stored token for cross-domain fallback
 * - Global error response interceptor
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token helpers for cross-domain auth (localStorage fallback when cookies are blocked)
export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('slidevault_token', token);
  }
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('slidevault_token');
  }
  return null;
};

export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('slidevault_token');
  }
};

// Request interceptor: attach token from localStorage as Authorization header
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract meaningful error message
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';

    // Don't redirect on auth/me failures (expected when not logged in)
    if (
      error.response?.status === 401 &&
      !error.config.url.includes('/auth/me')
    ) {
      // Could redirect to login or dispatch an event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    return Promise.reject({ ...error, message });
  }
);

export default api;
