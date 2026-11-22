// Static pictures and texts used by the screens.
// (Cuisines, food types, areas and everything else now come from the backend API.)
import images from '../assets/images';

/** Round pictures for each cuisine name (cuisine names come from the backend). */
export const CUISINE_IMAGES = {
  Desi: images.cuisines.desi,
  BBQ: images.cuisines.bbq,
  'Fast Food': images.cuisines['fast-food'],
  Pizza: images.cuisines.pizza,
  Chinese: images.cuisines.chinese,
  Desserts: images.cuisines.desserts,
  Bakery: images.cuisines.breads,
};

/** The five circles shown on the landing page */
export const LANDING_CUISINES = ['Desi', 'BBQ', 'Fast Food', 'Pizza', 'Chinese'];

export const POPULAR_SEARCHES = ['Biryani', 'Burger', 'Karahi', 'Broast', 'Shawarma', 'Pizza', 'Cake', 'Chai'];
