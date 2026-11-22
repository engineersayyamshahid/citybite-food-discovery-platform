import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import SmartImage from '../common/SmartImage';
import Badge from '../common/Badge';
import { RatingText } from '../common/Stars';
import FavButton from './FavButton';
import { img } from '../../services/apiClient';

// All cards below take a RestaurantCardDto from the API:
// { restaurantId, name, coverPhotoUrl, logoUrl, areaName, cuisines[], avgRating, reviewCount, isOpenNow, isSponsored }
const photoOf = (r) => img(r.logoUrl || r.coverPhotoUrl);
const coverOf = (r) => img(r.coverPhotoUrl || r.logoUrl);

/** "Sponsored" banner card (Home + Explore). ?src=sponsored lets the backend count the tap. */
export function SponsoredCard({ restaurant }) {
  return (
    <Link to={`/restaurant/${restaurant.restaurantId}?src=sponsored`} className="sponsored-card">
      <SmartImage src={coverOf(restaurant)} alt="" className="sp-img" label={restaurant.name} />
      <div className="grow">
        <Badge variant="sponsored">Sponsored</Badge>
        <h3 className="sp-name">{restaurant.name}</h3>
        <p className="muted small">{restaurant.cuisines.join(' · ')} · {restaurant.areaName} <span className="dot">·</span> <RatingText value={restaurant.avgRating} count={restaurant.reviewCount} /></p>
      </div>
      <ChevronRight size={18} className="muted" />
    </Link>
  );
}

/** Ranked restaurant row: "1  [photo] Tabaq Kitchen  ★ 4.8 (212)" */
export function RankedRestaurantRow({ restaurant, rank, index = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index, 8) * 0.05 }}>
      <Link to={`/restaurant/${restaurant.restaurantId}`} className="rest-row card hoverable">
        <span className={`rank-num ${rank === 1 ? 'first' : ''}`}>{rank}</span>
        <SmartImage src={coverOf(restaurant)} alt={restaurant.name} className="rest-thumb" label={restaurant.name} />
        <div className="grow">
          <h3 className="rest-name">{restaurant.name}</h3>
          <p className="muted small">{restaurant.cuisines.join(' · ')} · {restaurant.areaName}</p>
        </div>
        {restaurant.reviewCount > 0 ? <RatingText value={restaurant.avgRating} count={restaurant.reviewCount} /> : <span className="muted xs">New</span>}
      </Link>
    </motion.div>
  );
}

/** Plain restaurant row for search results / favourites */
export function RestaurantRow({ restaurant, showFav = false, index = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04 }}>
      <Link to={`/restaurant/${restaurant.restaurantId}`} className="rest-row card hoverable">
        <SmartImage src={coverOf(restaurant)} alt={restaurant.name} className="rest-thumb lg" label={restaurant.name} />
        <div className="grow">
          <h3 className="rest-name">{restaurant.name}</h3>
          <p className="muted small">{restaurant.cuisines.join(' · ') || 'New on CityBite'} · {restaurant.areaName}</p>
          {restaurant.isSponsored && <Badge variant="sponsored">Sponsored</Badge>}
        </div>
        <div className="dish-side">
          {showFav && <FavButton kind="restaurants" id={restaurant.restaurantId} variant="solid" />}
          {restaurant.reviewCount > 0 ? <RatingText value={restaurant.avgRating} count={restaurant.reviewCount} /> : <span className="muted xs">New</span>}
        </div>
      </Link>
    </motion.div>
  );
}

export { photoOf, coverOf };
