import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  // Use environment variable with fallback to prevent production crashes
  baseURL: import.meta.env.VITE_API_BASE_URL || '/csebro/api',
  withCredentials: true, // Send HTTP-only cookies (JWT) with every request
  timeout: 15000, // 15 seconds timeout to prevent hanging requests
});

api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle standard HTTP errors globally
    if (error.response) {
      const { status } = error.response;
      if (status === 401 && !error.config._retry) {
        // Unauthorized - Invalid or expired token
        error.config._retry = true;
        try {
          // Attempt to refresh the access token using the httpOnly refresh token cookie
          await axios.post(
            (import.meta.env.VITE_API_BASE_URL || '/csebro/api') + '/auth/refresh',
            {},
            { withCredentials: true }
          );
          // Retry original request
          return api(error.config);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?expired=true';
          }
          return Promise.reject(refreshError);
        }
      } else if (status === 401) {
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      } else if (status === 403) {
        // Forbidden - Role lacks permissions
        console.warn('Access denied: You do not have permission for this action.');
      } else if (status >= 500) {
        // Server errors
        console.error('Server error occurred:', error.response.data);
      }
    } else if (error.request) {
      // Network errors (CORS, offline, server down)
      console.error('Network Error: Please check your connection or server status.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
