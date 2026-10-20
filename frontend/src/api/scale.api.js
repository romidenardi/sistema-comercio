import api from './axios.js';

export const getScaleConfig = () => api.get('/scale-config');
export const updateScaleConfig = (data) => api.put('/scale-config', data);
