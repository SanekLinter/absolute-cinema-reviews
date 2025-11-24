import axios from 'axios';
import { extractError } from '../utils/extractError';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Перехватчик ошибок
api.interceptors.response.use(
  (res) => res,
  (err) => {
    err.uiMessage = extractError(err);
    return Promise.reject(err);
  }
);

export default api;
