// api/axios.js
// Pre-configured Axios instance that automatically attaches the JWT auth token
// (if present) to every outgoing request.

import axios from 'axios';

// In development, Vite proxies '/api' to the local backend (see vite.config.js).
// In production, set VITE_API_URL to your deployed backend's full URL
// (e.g. https://ai-support-api.onrender.com/api) as a build-time env variable.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Central place to handle expired/invalid tokens - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
