import axios from 'axios';

// All requests go through Vite's proxy → http://localhost:3001
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cp_token');
      localStorage.removeItem('cp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
