// Bills created by the restaurant  ->  /api/my-restaurant/bill-menu and /api/my-restaurant/bills
import { api } from './apiClient';

/** Total of the lines picked on screen (only for showing a preview - the backend calculates the real total) */
export const previewTotal = (lines) => lines.reduce((s, l) => s + l.price * l.qty, 0);
export const previewCount = (lines) => lines.reduce((s, l) => s + l.qty, 0);

export const billService = {
  menu: () => api('/api/my-restaurant/bill-menu'),
  /** items: [{ dishId, sizeId, qty }]  - only IDs and quantities, prices come from the database */
  create: (tableNo, items) => api('/api/my-restaurant/bills', { method: 'POST', body: { tableNo, items } }),
  get: (id) => api(`/api/my-restaurant/bills/${id}`),
  list: (page = 1, pageSize = 20) => api('/api/my-restaurant/bills', { query: { page, pageSize } }),
};
