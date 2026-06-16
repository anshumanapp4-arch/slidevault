import axios from 'axios';

/**
 * Configured Axios instance for API calls.
 * - Base URL from environment variable
 * - Credentials included for cookie-based auth
 * - Global error response interceptor
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
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
