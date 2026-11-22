// Everything the restaurant owner manages  ->  /api/my-restaurant/*
import { api } from './apiClient';
import { fileForm } from '../utils/helpers';

export const myRestaurantService = {
  // ----- restaurant details (screen 37) -----
  get: () => api('/api/my-restaurant'),
  update: (body) => api('/api/my-restaurant', { method: 'PUT', body }),    // { name, description, address, areaId, cuisineIds }
  uploadLogo: (file) => api('/api/my-restaurant/logo', { method: 'POST', form: fileForm(file) }),
  uploadCover: (file) => api('/api/my-restaurant/cover', { method: 'POST', form: fileForm(file) }),

  // ----- opening hours (screen 38) -----
  hours: () => api('/api/my-restaurant/opening-hours'),
  saveHours: (days) => api('/api/my-restaurant/opening-hours', { method: 'PUT', body: { days } }),

  // ----- menu: categories + dishes (screens 31-33) -----
  categories: () => api('/api/my-restaurant/categories'),
  addCategory: (name) => api('/api/my-restaurant/categories', { method: 'POST', body: { name } }),
  dishes: (categoryId) => api('/api/my-restaurant/dishes', { query: { categoryId } }),
  dish: (id) => api(`/api/my-restaurant/dishes/${id}`),
  addDish: (body) => api('/api/my-restaurant/dishes', { method: 'POST', body }),
  editDish: (id, body) => api(`/api/my-restaurant/dishes/${id}`, { method: 'PUT', body }),
  setAvailability: (id, isAvailable) => api(`/api/my-restaurant/dishes/${id}/availability`, { method: 'PATCH', body: { isAvailable } }),
  deleteDish: (id) => api(`/api/my-restaurant/dishes/${id}`, { method: 'DELETE' }),
  uploadDishPhoto: (id, file) => api(`/api/my-restaurant/dishes/${id}/photo`, { method: 'POST', form: fileForm(file) }),

  // ----- reviews (screen 34) -----
  reviews: (page = 1, pageSize = 10, dishId) => api('/api/my-restaurant/reviews', { query: { page, pageSize, dishId } }),

  // ----- promotions (screens 39-40) -----
  promotions: () => api('/api/my-restaurant/promotions'),
  startPromotion: (packageId, durationDays) => api('/api/my-restaurant/promotions', { method: 'POST', body: { packageId, durationDays } }),
  extendPromotion: (id, durationDays) => api(`/api/my-restaurant/promotions/${id}/extend`, { method: 'POST', body: { durationDays } }),
  stopPromotion: (id) => api(`/api/my-restaurant/promotions/${id}/stop`, { method: 'POST' }),
};
