import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackButton from '../../components/common/BackButton';
import FavButton from '../../components/cards/FavButton';
import SmartImage from '../../components/common/SmartImage';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';
import DishRow from '../../components/cards/DishRow';
import { RatingText } from '../../components/common/Stars';
import { Skeleton } from '../../components/loaders/Skeleton';
import useAsync from '../../hooks/useAsync';
import { browseService } from '../../services/browseService';
import { img } from '../../services/apiClient';
import { formatPrice } from '../../utils/helpers';
import NotFound from '../NotFound';

/** One dish (GET /api/dishes/:id): big photo, price, restaurant, sizes, rating and related dishes. */
export default function FoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: dish, loading, error, reload } = useAsync(() => browseService.dish(id), [id]);

  // related = same food type first (GET /api/dishes?foodTypeId=), then more from the same restaurant
  const related = useAsync(async () => {
    const byType = dish.foodTypeId ? (await browseService.dishes({}, { foodTypeId: dish.foodTypeId, pageSize: 5 })).items : [];
    const same = (await browseService.dishes({}, { restaurantId: dish.restaurantId, pageSize: 5 })).items;
    const seen = new Set([dish.dishId]);
    return [...byType, ...same].filter((d) => !seen.has(d.dishId) && seen.add(d.dishId)).slice(0, 4);
  }, [dish?.dishId], { enabled: !!dish });

  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="page"><ErrorState error={error} onRetry={reload} /></div>;
  if (loading || !dish) return <div className="detail"><Skeleton h={280} r={0} /><div className="page"><Skeleton h={34} w="70%" /><div style={{ height: 14 }} /><Skeleton h={60} r={12} /></div></div>;

  return (
    <div className="detail food-detail">
      <div className="cover food-cover">
        <SmartImage src={img(dish.photoUrl)} alt={dish.name} className="cover-img" label={dish.name} />
        <div className="cover-bar"><BackButton fallback="/explore" className="glass" /><FavButton kind="dishes" id={dish.dishId} variant="glass" /></div>
      </div>
      <div className="page detail-body">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="row between top">
            <h1 className="h-serif">{dish.name}</h1>
            <span className="price big">{dish.sizes.length > 1 ? 'From ' : ''}{formatPrice(dish.price)}</span>
          </div>
          <p className="sub-line"><Link to={`/restaurant/${dish.restaurantId}`} className="link-orange bold">{dish.restaurantName}</Link> <span className="muted">· {dish.cuisines.join(' · ')} · {dish.areaName}</span></p>
          <div className="row gap-sm wrap">
            {dish.reviewCount > 0 ? <RatingText value={dish.avgRating} count={`${dish.reviewCount} reviews`} size={15} /> : <span className="muted small">No ratings yet</span>}
            {dish.rank && dish.rankOutOf && <Badge variant="green">#{dish.rank} of {dish.rankOutOf} {dish.foodTypeName?.toLowerCase()}</Badge>}
            {!dish.isAvailable && <Badge variant="gray">Not available right now</Badge>}
          </div>
          {dish.description && <p className="desc">{dish.description}</p>}
          {dish.sizes.length > 0 && (
            <div className="sizes">
              <p className="eyebrow">Size</p>
              {dish.sizes.map((s) => <div key={s.sizeId} className="size-row"><span>{s.label}</span><span className="muted">{formatPrice(s.price)}</span></div>)}
            </div>
          )}
          <p className="muted small tip">CityBite is for finding food - visit {dish.restaurantName} to order.</p>
          <div className="detail-cta"><Button block onClick={() => navigate(`/dish/${dish.dishId}/reviews`)}>See reviews</Button></div>
        </motion.div>

        {related.data?.length > 0 && (
          <section className="section">
            <h2 className="h-serif">You may also like</h2>
            <div className="list-grid">{related.data.map((d, i) => <DishRow key={d.dishId} dish={d} index={i} />)}</div>
          </section>
        )}
      </div>
    </div>
  );
}
