import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../stores/auth';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const store = useAuthStore.getState();
      if (store.token) {
        // Token exists but was invalidated (kicked out by another login)
        store.setKickedMessage('当前账号已在其他地方登录');
        setTimeout(() => {
          store.logout();
          window.location.href = '/login';
        }, 3000);
      } else {
        store.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
