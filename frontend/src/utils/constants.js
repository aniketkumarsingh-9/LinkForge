export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const SHORT_BASE_URL = import.meta.env.VITE_SHORT_BASE_URL || window.location.origin;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  URL_DETAILS: '/urls/:id',
  NOT_FOUND: '/404',
};
