// Values shared by many files (roles, sort names, price buckets...)

/** Role names exactly as the backend sends them */
export const ROLES = { customer: 'customer', owner: 'restaurant_owner' };

/** Where each kind of user goes after logging in */
export const homeFor = (user) => (user?.role === ROLES.owner ? '/r/bill' : '/home');

/** Price filter buttons -> backend minPrice / maxPrice */
export const PRICE_BUCKETS = [
  { id: 'any', label: 'Any' },
  { id: 'u500', label: 'Under 500', max: 499 },
  { id: '500-1000', label: '500–1,000', min: 500, max: 1000 },
  { id: '1000-2000', label: '1,000–2,000', min: 1000, max: 2000 },
  { id: '2000+', label: '2,000+', min: 2000 },
];

/** Sort options. "key" is what the backend expects in ?sort= */
export const DISH_SORTS = [
  { id: 'top', label: 'Top rated', api: 'top_rated' },
  { id: 'reviews', label: 'Most reviewed', api: 'most_reviewed' },
  { id: 'price', label: 'Price: low to high', api: 'price_asc' },
];
export const RESTAURANT_SORTS = [
  { id: 'top', label: 'Top rated', api: 'top_rated' },
  { id: 'reviews', label: 'Most reviewed', api: 'most_reviewed' },
];

/** Opening hours days: backend uses 1 = Monday ... 7 = Sunday */
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
