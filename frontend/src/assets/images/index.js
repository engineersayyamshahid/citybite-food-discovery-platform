// Pictures that are part of the website design itself (landing page, login art, cuisine circles).
// Photos of real restaurants and dishes come from the backend (/uploads/...), not from here.
import cuiBbq from './cuisines/bbq.jpg';
import cuiBreads from './cuisines/breads.jpg';
import cuiChinese from './cuisines/chinese.jpg';
import cuiDesi from './cuisines/desi.jpg';
import cuiDesserts from './cuisines/desserts.jpg';
import cuiFastFood from './cuisines/fast-food.jpg';
import cuiPizza from './cuisines/pizza.jpg';
import disCheeseLoversPizza from './dishes/cheese-lovers-pizza.jpg';
import disChickenKarahi from './dishes/chicken-karahi.jpg';
import disPizzaMargherita from './dishes/pizza-margherita.jpg';
import disSeekhKabab from './dishes/seekh-kabab.jpg';

const images = {
  cuisines: {
    bbq: cuiBbq,
    breads: cuiBreads,
    chinese: cuiChinese,
    desi: cuiDesi,
    desserts: cuiDesserts,
    'fast-food': cuiFastFood,
    pizza: cuiPizza,
  },
  dishes: {
    'cheese-lovers-pizza': disCheeseLoversPizza,
    'chicken-karahi': disChickenKarahi,
    'pizza-margherita': disPizzaMargherita,
    'seekh-kabab': disSeekhKabab,
  },
};

export default images;
