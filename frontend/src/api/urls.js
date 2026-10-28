import { api } from './client.js';

export const createShortUrl = async ({ originalUrl, customAlias, expiresAt, title }) => {
  return api.post('/urls', {
    originalUrl,
    customAlias: customAlias || undefined,
    expiresAt: expiresAt || undefined,
    title: title || undefined,
  });
};

export const fetchUserUrls = async ({ page = 1, limit = 10, search = '', filter = 'all', sortBy = 'createdAt', order = 'desc' }) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    filter,
    sortBy,
    order,
  });

  if (search) {
    params.append('search', search);
  }

  return api.get(`/urls?${params.toString()}`);
};

export const fetchUrlDetails = async (id) => {
  return api.get(`/urls/${id}`);
};

export const updateShortUrl = async (id, data) => {
  return api.patch(`/urls/${id}`, data);
};

export const deleteShortUrl = async (id) => {
  return api.delete(`/urls/${id}`);
};
