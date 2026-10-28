import { api } from './client.js';

export const fetchUrlAnalytics = async (id, days = 30) => {
  return api.get(`/urls/${id}/analytics?days=${days}`);
};

export const fetchOverviewAnalytics = async () => {
  return api.get('/analytics/overview');
};
