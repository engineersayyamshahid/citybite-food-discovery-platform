// Bill-verified reviews (customer)  ->  /api/reviews/*
import { api } from './apiClient';
import { fileForm } from '../utils/helpers';

export const reviewService = {
  /** Enter the 6 character bill code. Returns the bill + the dishes that can be rated. Safe to call again. */
  redeem: (code) => api('/api/reviews/redeem', { method: 'POST', body: { code } }),

  /** ratings: [{ billItemId, rating, comment }]  ->  [{ reviewId, billItemId, dishId, rating }] */
  submit: (billId, ratings) => api('/api/reviews', { method: 'POST', body: { billId, ratings } }),

  /** Up to 3 photos per review. `file` is a File object. */
  addPhoto: (reviewId, file) => api(`/api/reviews/${reviewId}/photos`, { method: 'POST', form: fileForm(file) }),
};
