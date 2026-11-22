// Search filters <-> the address bar (?q=pizza&cuisine=1&rating=4).
// Keeping filters in the URL means the back button, refresh and shared links all work.

export const DEFAULT_FILTERS = { q: '', cuisines: [], price: 'any', rating: 0, sort: 'top', photos: false };

export const filtersFromParams = (sp) => ({
  q: sp.get('q') || '',
  cuisines: sp.getAll('cuisine').map(Number).filter(Boolean),   // cuisine IDs from the backend
  price: sp.get('price') || 'any',
  rating: Number(sp.get('rating')) || 0,
  sort: sp.get('sort') || 'top',
  photos: sp.get('photos') === '1',
});

export const filtersToParams = (f, extra = {}) => {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  f.cuisines.forEach((c) => sp.append('cuisine', c));
  if (f.price !== 'any') sp.set('price', f.price);
  if (f.rating) sp.set('rating', String(f.rating));
  if (f.sort !== 'top') sp.set('sort', f.sort);
  if (f.photos) sp.set('photos', '1');
  Object.entries(extra).forEach(([k, v]) => v && sp.set(k, v));
  return sp;
};

export const activeFilterCount = (f) =>
  f.cuisines.length + (f.price !== 'any' ? 1 : 0) + (f.rating ? 1 : 0) + (f.photos ? 1 : 0);
