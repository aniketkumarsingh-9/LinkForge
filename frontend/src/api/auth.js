import { api } from './client.js';

export const registerUser = async (email, password, name) => {
  return api.post('/auth/register', { email, password, name });
};

export const loginUser = async (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const logoutUser = async () => {
  return api.post('/auth/logout');
};

export const fetchCurrentUser = async () => {
  return api.get('/auth/me');
};
