import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = { login: (data) => api.post('/auth/login', data) };
export const userAPI = { getAll: () => api.get('/users'), create: (data) => api.post('/users', data) };
export const sessionAPI = { create: (data) => api.post('/sessions', data), verify: (id, data) => api.put(`/sessions/${id}/verify`, data) };