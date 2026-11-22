import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import SearchBar from '../../components/common/SearchBar';
import SmartImage from '../../components/common/SmartImage';
import FiltersSheet from '../../components/common/FiltersSheet';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import { SponsoredCard, RankedRestaurantRow } from '../../components/cards/RestaurantCards';
import { ListSkeleton, RestaurantRowSkeleton } from '../../components/loaders/Skeleton';
import useApp from '../../hooks/useApp';
import useAsync from '../../hooks/useAsync';
import usePaged from '../../hooks/usePaged';
import { browseService } from '../../services/browseService';
import { CUISINE_IMAGES } from '../../data/cuisines';
import { DEFAULT_FILTERS, filtersToParams } from '../../utils/filters';

/** Explore: search entry, cuisine circles (GET /api/cuisines), sponsored card (GET /api/home) and the ranked list (GET /api/restaurants). */
export default function Explore() {
  const { cuisines, area } = useApp();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const home = useAsync(() => browseService.home(), []);
  const list = usePaged((page) => browseService.restaurants({ sort: 'top' }, { page, pageSize: 10 }), []);

  return (
    <div className="page">
      <h1 className="h-serif">Explore</h1>
      <p className="muted">Browse restaurants and dishes in {area?.city || 'your city'}</p>

      <div className="search-row">
        <SearchBar value="" onChange={() => {}} onFocus={() => navigate('/search')} />
        <button type="button" className="icon-btn dark" onClick={() => setShowFilters(true)} aria-label="Open filters"><SlidersHorizontal size={20} /></button>
      </div>

      <h2 className="h-serif sub">Browse by cuisine</h2>
      <div className="cuisine-row scroll">
        {cuisines.map((c) => (
          <Link key={c.cuisineId} to={`/results?cuisine=${c.cuisineId}`} className="cuisine">
            <SmartImage src={CUISINE_IMAGES[c.name]} alt="" className="cuisine-img" label={c.name} /><span>{c.name}</span>
          </Link>
        ))}
      </div>

      {home.data?.sponsored && <SponsoredCard restaurant={home.data.sponsored} />}

      <h2 className="h-serif sub">Top rated in {area?.city || 'your city'}</h2>
      {list.loading ? <ListSkeleton count={4} row={RestaurantRowSkeleton} /> : list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : (
        <>
          <div className="list-grid">{list.items.map((r, i) => <RankedRestaurantRow key={r.restaurantId} restaurant={r} rank={i + 1} index={i} />)}</div>
          {list.hasMore && <div className="center" style={{ marginTop: 16 }}><Button variant="outline" loading={list.loadingMore} onClick={list.loadMore}>Load more</Button></div>}
        </>
      )}

      <FiltersSheet
        open={showFilters} onClose={() => setShowFilters(false)} filters={DEFAULT_FILTERS}
        onApply={(f) => { setShowFilters(false); navigate(`/results?${filtersToParams(f)}`); }}
      />
    </div>
  );
}
