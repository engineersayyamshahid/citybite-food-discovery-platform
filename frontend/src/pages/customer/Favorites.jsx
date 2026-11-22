import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import Segmented from '../../components/common/Segmented';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import DishRow from '../../components/cards/DishRow';
import { RestaurantRow } from '../../components/cards/RestaurantCards';
import { ListSkeleton } from '../../components/loaders/Skeleton';
import useApp from '../../hooks/useApp';
import useAsync from '../../hooks/useAsync';
import { meService } from '../../services/meService';

/**
 * Saved dishes and restaurants (GET /api/me/favorites).
 * Tapping a heart removes it from the list right away (and from the database).
 */
export default function Favorites() {
  const { favs } = useApp();
  const [tab, setTab] = useState('dishes');
  const { data, loading, error, reload } = useAsync(() => meService.favorites(), []);

  // the list from the server is filtered by the hearts that are still on
  const dishes = (data?.dishes || []).filter((d) => favs.dishes.has(d.dishId));
  const places = (data?.restaurants || []).filter((r) => favs.restaurants.has(r.restaurantId));

  return (
    <div className="page">
      <h1 className="h-serif">Favorites</h1>
      <Segmented options={[{ value: 'dishes', label: `Dishes (${dishes.length})` }, { value: 'restaurants', label: `Restaurants (${places.length})` }]} value={tab} onChange={setTab} />
      {tab === 'dishes' && <p className="muted small tip">The best-rated places for these dishes show at the top of your Home screen.</p>}
      {loading ? <ListSkeleton count={3} /> : error ? <ErrorState error={error} onRetry={reload} /> : tab === 'dishes' ? (
        dishes.length ? <div className="list-grid">{dishes.map((d, i) => <DishRow key={d.dishId} dish={d} showFav index={i} />)}</div>
          : <EmptyState icon={Heart} title="No favorite dishes yet" text="Tap the heart on any dish to save it here." action={<Link to="/explore" className="btn btn-primary">Explore dishes</Link>} />
      ) : (
        places.length ? <div className="list-grid">{places.map((r, i) => <RestaurantRow key={r.restaurantId} restaurant={r} showFav index={i} />)}</div>
          : <EmptyState icon={Heart} title="No favorite restaurants yet" text="Tap the heart on a restaurant page to save it." action={<Link to="/explore" className="btn btn-primary">Explore restaurants</Link>} />
      )}
    </div>
  );
}
