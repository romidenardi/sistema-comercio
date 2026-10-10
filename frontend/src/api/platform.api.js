import axios from 'axios';
import api from './axios';

const TOKEN_KEY = 'platformToken';

export const getPlatformToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setPlatformToken = (token) => {
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch { /* sin storage */ }
};
export const clearPlatformToken = () => {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* sin storage */ }
};

// Instancia aparte: reutiliza la URL base del sistema pero con su propio token
const platformApi = axios.create({ baseURL: api.defaults.baseURL });

platformApi.interceptors.request.use((config) => {
  const token = getPlatformToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

platformApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error.config?.url?.includes('/platform/login');
    if (error.response?.status === 401 && !isLogin) {
      clearPlatformToken();
      window.location.href = '/plataforma/login';
    }
    return Promise.reject(error);
  }
);

export const platformLogin = (data) => platformApi.post('/platform/login', data);
export const getBusinesses = () => platformApi.get('/platform/businesses');
export const createBusiness = (data) => platformApi.post('/platform/businesses', data);
export const setBusinessStatus = (id, status) =>
  platformApi.patch(`/platform/businesses/${id}/status`, { status });
export const reinviteBusinessAdmin = (id, userId) =>
  platformApi.post(`/platform/businesses/${id}/reinvite`, userId ? { userId } : {});
export const resetDemoBusiness = (id) => platformApi.post(`/platform/businesses/${id}/reset-demo`);