// The logged-in person: profile, area, taste picks, favourites, own reviews  ->  /api/me/*
import { api } from './apiClient';

export const meService = {
  profile: () => api('/api/me'),
  updateProfile: (fullName) => api('/api/me', { method: 'PUT', body: { fullName } }),
  changePassword: (body) => api('/api/me/password', { method: 'PUT', body }),   // { currentPassword, newPassword }

  setArea: (areaId) => api('/api/me/area', { method: 'PUT', body: { areaId } }),

  taste: () => api('/api/me/taste'),                                               // { foodTypeIds, foodTypes }
  setTaste: (foodTypeIds) => api('/api/me/taste', { method: 'PUT', body: { foodTypeIds } }),

  favorites: () => api('/api/me/favorites'),                                       // { dishes, restaurants }
  addFavorite: (kind, id) => api(`/api/me/favorites/${kind}/${id}`, { method: 'PUT' }),
  removeFavorite: (kind, id) => api(`/api/me/favorites/${kind}/${id}`, { method: 'DELETE' }),

  myReviews: (page = 1, pageSize = 20) => api('/api/me/reviews', { query: { page, pageSize } }),
};
