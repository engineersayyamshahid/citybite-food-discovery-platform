import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SmartImage from '../common/SmartImage';
import Badge from '../common/Badge';
import { RatingText } from '../common/Stars';
import FavButton from './FavButton';
import { img } from '../../services/apiClient';
import { formatPrice } from '../../utils/helpers';

/**
 * One dish in a list (search results, favourites...).
 * `dish` is a DishCardDto from the API: { dishId, name, photoUrl, price, avgRating, reviewCount, restaurantName, areaName, rank, isSponsored ... }
 */
export default function DishRow({ dish, showFav = false, index = 0 }) {
  const rankLabel = dish.rank && dish.rank <= 2 && dish.foodTypeName ? `#${dish.rank} rated ${dish.foodTypeName.toLowerCase()}` : '';
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04 }}>
      <Link to={`/dish/${dish.dishId}`} className="dish-row">
        <SmartImage src={img(dish.photoUrl)} alt={dish.name} className="dish-thumb" />
        <div className="dish-info">
          <h3 className="dish-name">{dish.name}</h3>
          <p className="muted small">{dish.restaurantName} · {dish.areaName}</p>
          {rankLabel && <Badge variant={dish.rank === 1 ? 'green' : 'rank-soft'}>{rankLabel}</Badge>}
          {dish.isSponsored && <Badge variant="sponsored">Sponsored</Badge>}
          {!dish.isAvailable && <Badge variant="gray">Not available</Badge>}
          <div className="dish-meta">
            {dish.reviewCount > 0 ? <RatingText value={dish.avgRating} count={`${dish.reviewCount} reviews`} /> : <span className="muted small">No ratings yet</span>}
          </div>
        </div>
        <div className="dish-side">
          {showFav && <FavButton kind="dishes" id={dish.dishId} variant="solid" />}
          <span className="price">{formatPrice(dish.price)}</span>
        </div>
      </Link>
    </motion.div>
  );
}
