import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpDown, MapPin, Search, SearchX, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';
import BackButton from '../../components/common/BackButton';
import FavButton from '../../components/cards/FavButton';
import SmartImage from '../../components/common/SmartImage';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Stars, { RatingText } from '../../components/common/Stars';
import { Skeleton } from '../../components/loaders/Skeleton';
import useAsync from '../../hooks/useAsync';
import { browseService } from '../../services/browseService';
import { img } from '../../services/apiClient';
import { formatPrice } from '../../utils/helpers';
import NotFound from '../NotFound';

/** Restaurant profile (GET /api/restaurants/:id): cover, rating, menu with search, customer photos, opening hours. */
export default function RestaurantDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const src = params.get('src') === 'sponsored' ? 'sponsored' : undefined;   // the backend counts this as a tap on the sponsored card
  const [q, setQ] = useState('');
  const [byPrice, setByPrice] = useState(false);
  const { data: r, loading, error, reload } = useAsync(() => browseService.restaurant(id, src), [id]);

  const menu = useMemo(() => {
    const items = (r?.dishes || []).filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));
    // the backend already sends them best rated first; "Price" sorts the list on screen
    return byPrice ? [...items].sort((a, b) => a.price - b.price) : items;
  }, [r, q, byPrice]);

  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="page"><ErrorState error={error} onRetry={reload} /></div>;
  if (loading || !r) return <div className="detail"><Skeleton h={240} r={0} /><div className="page"><Skeleton h={40} w="60%" /><div style={{ height: 14 }} /><Skeleton h={96} r={16} /></div></div>;

  const cover = img(r.coverPhotoUrl || r.logoUrl);
  const topDishes = [...r.dishes].filter((d) => d.reviewCount > 0).sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 3);

  return (
    <div className="detail restaurant-cover">
      <div className="cover">
        {/* blurred copy fills the sides, sharp copy sits on top so small photos never look stretched */}
        {cover && <img src={cover} alt="" className="cover-bg" aria-hidden="true" />}
        <SmartImage src={cover} alt={`${r.name} food`} className="cover-img contain" label={r.name} />
        <div className="cover-bar"><BackButton fallback="/explore" className="glass" /><FavButton kind="restaurants" id={r.restaurantId} variant="glass" /></div>
      </div>

      <div className="page detail-body">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="row between top">
            <div className="row gap-sm">
              {r.logoUrl && <img src={img(r.logoUrl)} alt="" className="logo-sm" />}
              <h1 className="h-serif">{r.name}</h1>
            </div>
            {r.reviewCount > 0 && <span className="rating-pill"><RatingText value={r.avgRating} /></span>}
          </div>
          <p className="muted">{r.cuisines.join(' · ') || 'New on CityBite'} · {r.reviewCount} ratings · {r.isOpenNow ? `Open until ${r.openUntil}` : 'Closed now'}</p>
          <div className="meta-row muted small">
            <span><MapPin size={14} /> {r.address}, {r.areaName}</span>
            {r.dineIn && <span><Utensils size={14} /> Dine-in</span>}
          </div>
          {r.description && <p className="desc">{r.description}</p>}
        </motion.div>

        <div className="detail-cols">
          <section className="detail-main">
            <div className="search-row">
              <div className="searchbar"><Search size={18} className="searchbar-icon" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search in ${r.name}`} aria-label="Search the menu" /></div>
              <button type="button" className="btn btn-dark btn-md" onClick={() => setByPrice((p) => !p)} aria-pressed={byPrice}><ArrowUpDown size={15} /> {byPrice ? 'Price' : 'Top rated'}</button>
            </div>
            <h2 className="h-serif sub">{byPrice ? 'Menu by price' : 'Top rated dishes'}</h2>
            {menu.length === 0 ? (
              <EmptyState icon={SearchX} title={q ? 'No dish found' : 'Menu coming soon'} text={q ? 'Try another name.' : 'This restaurant has not added dishes yet.'} />
            ) : (
              <div className="menu-list">
                {menu.map((d, i) => (
                  <Link key={d.dishId} to={`/dish/${d.dishId}`} className={`menu-item ${d.isAvailable ? '' : 'off'}`}>
                    <div className="grow">
                      {!byPrice && !q && i === 0 && d.isAvailable && d.reviewCount > 0 && <Badge variant="rank">#1 rated</Badge>}
                      {!byPrice && !q && i === 1 && d.isAvailable && d.reviewCount > 0 && <Badge variant="rank-soft">#2</Badge>}
                      {!d.isAvailable && <Badge variant="gray">Not available</Badge>}
                      <h3>{d.name}</h3>
                      {d.reviewCount > 0 && <p className="rating-line"><RatingText value={d.avgRating} count={d.reviewCount} /></p>}
                      {d.foodTypeName && <p className="muted small clamp">{d.foodTypeName}</p>}
                      <b className="price">{formatPrice(d.price)}</b>
                    </div>
                    <SmartImage src={img(d.photoUrl)} alt={d.name} className="menu-thumb" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="detail-side">
            {r.customerPhotos.length > 0 && (
              <section>
                <h2 className="h-serif sub">Photos from customers</h2>
                <div className="photo-strip">{r.customerPhotos.map((p, i) => <img key={i} src={img(p)} alt="Customer food" loading="lazy" />)}</div>
              </section>
            )}
            <section>
              <h2 className="h-serif sub">Opening hours</h2>
              <ul className="hours-list small">
                {r.openingHours.map((h) => <li key={h.dayOfWeek}><span>{h.day}</span><span className={h.isClosed ? 'muted' : ''}>{h.isClosed ? 'Closed' : `${h.openTime} – ${h.closeTime}`}</span></li>)}
              </ul>
            </section>
          </aside>
        </div>

        <section className="reviews-block">
          <h2 className="h-serif sub">Ratings &amp; reviews</h2>
          {r.reviewCount > 0 ? (
            <div className="rating-summary card">
              <div className="rs-left"><div className="rs-num">{Number(r.avgRating).toFixed(1)}</div><Stars value={r.avgRating} size={13} /><p className="muted small">{r.reviewCount} reviews</p></div>
              <div className="rs-bars">
                <p className="small muted">Customers rate each dish after they eat. Open a dish to read its reviews:</p>
                {topDishes.map((d) => <Link key={d.dishId} to={`/dish/${d.dishId}/reviews`} className="link-orange small">{d.name} · {d.reviewCount} reviews</Link>)}
              </div>
            </div>
          ) : <p className="muted">No reviews yet.</p>}
          <p className="muted small tip">Want to rate your meal? Use the review code printed on your bill under <Link to="/reviews/add" className="link-orange">Reviews</Link>.</p>
        </section>
      </div>
    </div>
  );
}
