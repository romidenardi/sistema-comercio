import api from './axios.js';

export const loginRequest = (email, password) =>
  api.post('/auth/login', { email, password });

export const registerRequest = (data) =>
  api.post('/auth/register', data);