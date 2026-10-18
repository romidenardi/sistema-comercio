import api from './axios.js';

export const createCombo = (data) => api.post('/combos', data);
export const updateCombo = (id, data) => api.put(`/combos/${id}`, data);
export const deleteCombo = (id) => api.delete(`/combos/${id}`);
