import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Heart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import Chip from '../../components/common/Chip';
import Badge from '../../components/common/Badge';
import SmartImage from '../../components/common/SmartImage';
import ErrorState from '../../components/common/ErrorState';
import { RatingText } from '../../components/common/Stars';
import { SponsoredCard } from '../../components/cards/RestaurantCards';
import DishRow from '../../components/cards/DishRow';
import { HeroSkeleton, Skeleton, ListSkeleton } from '../../components/loaders/Skeleton';
import useApp from '../../hooks/useApp';
import useAsync from '../../hooks/useAsync';
import { browseService } from '../../services/browseService';
import { img } from '../../services/apiClient';

/**
 * Customer Home (GET /api/home): area, sponsored card and "Top rated for you" from the taste picks.
 * Tapping a chip asks the backend again with ?foodTypeId=.
 */
export default function Home() {
  const { area } = useApp();
  const [typeId, setTypeId] = useState(undefined);        // undefined = the backend picks the first chip
  const home = useAsync(() => browseService.home(typeId), [typeId]);
  const trending = useAsync(() => browseService.dishes({ sort: 'top' }, { pageSize: 4 }), []);

  const h = home.data;
  const top = h?.topForSelected || [];
  const [first, ...others] = top;
  const selectedChip = h?.foodTypeChips.find((c) => c.foodTypeId === h.selectedFoodTypeId);

  return (
    <div className="page home">
      <Link to="/onboarding/area" className="area-head">
        <span className="muted small">Showing restaurants near</span>
        <b className="area-name">{h?.areaName || area?.name || 'Choose your area'}{(area?.city) ? `, ${area.city}` : ''} <ChevronDown size={16} /></b>
      </Link>

      {home.error && !h ? <ErrorState error={home.error} onRetry={home.reload} /> : (
        <>
          {h?.sponsored && <SponsoredCard restaurant={h.sponsored} />}

          <section className="section">
            <h1 className="h-serif">Top rated for you</h1>
            <p className="muted">Pick a favorite to see its best-ranked places</p>
            <div className="chips-scroll">
              {(h?.foodTypeChips || []).map((c) => (
                <Chip key={c.foodTypeId} on={h.selectedFoodTypeId === c.foodTypeId} icon={Heart} onClick={() => setTypeId(c.foodTypeId)}>{c.name}</Chip>
              ))}
              <Link to="/onboarding/taste" state={{ editing: true }} className="chip chip-link">Edit</Link>
            </div>

            {home.loading && !h ? (
              <div className="top-grid"><HeroSkeleton /><div className="top-side"><Skeleton h={160} r={20} /><Skeleton h={160} r={20} /></div></div>
            ) : (
              <motion.div key={h?.selectedFoodTypeId ?? 'none'} className="top-grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: home.loading ? 0.5 : 1, y: 0 }}>
                {first ? (
                  <Link to={`/restaurant/${first.restaurantId}`} className="hero-card">
                    <SmartImage src={img(first.photoUrl)} alt="" className="hero-img" label={first.restaurantName} />
                    <div className="hero-shade" />
                    <Badge variant="rank">#1 for {selectedChip?.name || first.foodTypeName}</Badge>
                    <div className="hero-card-text">
                      <h2 className="h-serif">{first.restaurantName}</h2>
                      <p>{first.name} · {first.areaName}</p>
                    </div>
                    <span className="hero-rating"><Star size={14} fill="currentColor" /> <b>{Number(first.avgRating).toFixed(1)}</b> ({first.reviewCount})</span>
                  </Link>
                ) : (
                  <p className="muted">No rated dishes for this food yet. Be the first to review one!</p>
                )}
                <div className="top-side">
                  {others.map((o, i) => (
                    <Link key={o.dishId} to={`/restaurant/${o.restaurantId}`} className="mini-card">
                      <div className="mini-img"><SmartImage src={img(o.photoUrl)} alt="" label={o.restaurantName} /><span className="mini-rank">#{i + 2}</span></div>
                      <div className="row between"><b>{o.restaurantName}</b><RatingText value={o.avgRating} /></div>
                      <p className="muted small">{o.name} · {o.reviewCount} ratings</p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
            <div className="center"><Link to="/explore" className="link-orange see-all">See all in Explore <ChevronRight size={16} /></Link></div>
          </section>
        </>
      )}

      <section className="section">
        <h2 className="h-serif">Trending dishes</h2>
        <p className="muted">Highest rated dishes right now</p>
        {trending.loading ? <ListSkeleton count={2} /> : trending.error ? <ErrorState error={trending.error} onRetry={trending.reload} compact /> : (
          <div className="list-grid">{trending.data.items.map((d, i) => <DishRow key={d.dishId} dish={d} index={i} />)}</div>
        )}
      </section>
    </div>
  );
}
