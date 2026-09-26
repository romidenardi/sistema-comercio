import api from './axios.js';

export const getPurchases = () => api.get('/purchases');
export const createPurchase = (data) => api.post('/purchases', data);