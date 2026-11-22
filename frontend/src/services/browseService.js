// Everything a visitor can browse (no login needed)  ->  /api/home, /api/dishes, /api/restaurants ...
import { api } from './apiClient';
import { DISH_SORTS, PRICE_BUCKETS, RESTAURANT_SORTS } from '../utils/constants';

/** UI filters ({ q, cuisines:[ids], price, rating, sort, photos }) -> backend query parameters */
const dishQuery = (f = {}, extra = {}) => {
  const bucket = PRICE_BUCKETS.find((b) => b.id === f.price) || {};
  return {
    q: f.q,
    cuisineIds: f.cuisines,
    minPrice: bucket.min,
    maxPrice: bucket.max,
    minRating: f.rating || undefined,
    withPhotos: f.photos,
    sort: (DISH_SORTS.find((s) => s.id === f.sort) || DISH_SORTS[0]).api,
    ...extra,
  };
};

export const browseService = {
  areas: () => api('/api/areas'),
  cuisines: () => api('/api/cuisines'),                                   // cuisines with their food types
  packages: () => api('/api/promotion-packages'),

  /** Home screen. foodTypeId = the chip the user tapped. */
  home: (foodTypeId) => api('/api/home', { query: { foodTypeId } }),

  /** Dishes -> { items, total, page, pageSize } */
  dishes: (filters, { page = 1, pageSize = 20, ...rest } = {}) =>
    api('/api/dishes', { query: dishQuery(filters, { page, pageSize, ...rest }) }),

  /** Restaurants -> { items, total, page, pageSize } */
  restaurants: (filters = {}, { page = 1, pageSize = 20, ...rest } = {}) =>
    api('/api/restaurants', {
      query: {
        q: filters.q,
        cuisineIds: filters.cuisines,
        minRating: filters.rating || undefined,
        sort: (RESTAURANT_SORTS.find((s) => s.id === filters.sort) || RESTAURANT_SORTS[0]).api,
        page,
        pageSize,
        ...rest,
      },
    }),

  /** src = 'sponsored' tells the backend the person came from the sponsored card (counts a tap) */
  restaurant: (id, src) => api(`/api/restaurants/${id}`, { query: { src } }),
  dish: (id) => api(`/api/dishes/${id}`),
  dishReviews: (id, page = 1, pageSize = 10) => api(`/api/dishes/${id}/reviews`, { query: { page, pageSize } }),
};
