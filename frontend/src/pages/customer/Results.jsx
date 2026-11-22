import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, SearchX, SlidersHorizontal } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import SearchBar from '../../components/common/SearchBar';
import Segmented from '../../components/common/Segmented';
import Chip from '../../components/common/Chip';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import FiltersSheet from '../../components/common/FiltersSheet';
import DishRow from '../../components/cards/DishRow';
import { RestaurantRow } from '../../components/cards/RestaurantCards';
import { ListSkeleton } from '../../components/loaders/Skeleton';
import Button from '../../components/common/Button';
import useApp from '../../hooks/useApp';
import usePaged from '../../hooks/usePaged';
import { browseService } from '../../services/browseService';
import { DEFAULT_FILTERS, activeFilterCount, filtersFromParams, filtersToParams } from '../../utils/filters';
import { DISH_SORTS, PRICE_BUCKETS, RESTAURANT_SORTS } from '../../utils/constants';

/**
 * Search + filter results for dishes (GET /api/dishes) and restaurants (GET /api/restaurants).
 * All filters live in the URL (?q=pizza&cuisine=1&rating=4) so refresh/back/share all work.
 */
export default function Results() {
  const { cuisines, addRecent } = useApp();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const key = params.toString();
  const tab = params.get('tab') === 'restaurants' ? 'restaurants' : 'dishes';
  const [text, setText] = useState(filters.q);
  const [showFilters, setShowFilters] = useState(false);

  // both lists are loaded so the tabs can show their counts
  const dishes = usePaged((page) => browseService.dishes(filters, { page }), [key]);
  const places = usePaged((page) => browseService.restaurants(filters, { page }), [key]);
  const active = tab === 'dishes' ? dishes : places;

  useEffect(() => { setText(filters.q); }, [filters.q]);

  const nFilters = activeFilterCount(filters);
  const update = (next, extra = {}) => setParams(filtersToParams(next, { tab: tab === 'restaurants' ? 'restaurants' : '', ...extra }), { replace: true });
  const submitSearch = (v) => { addRecent(v); update({ ...filters, q: v.trim() }); };
  const cuisineName = (id) => cuisines.find((c) => c.cuisineId === id)?.name || `Cuisine ${id}`;

  const chips = [
    ...filters.cuisines.map((c) => ({ key: `c-${c}`, label: cuisineName(c), remove: () => update({ ...filters, cuisines: filters.cuisines.filter((x) => x !== c) }) })),
    ...(filters.price !== 'any' ? [{ key: 'price', label: PRICE_BUCKETS.find((b) => b.id === filters.price)?.label, remove: () => update({ ...filters, price: 'any' }) }] : []),
    ...(filters.rating ? [{ key: 'rating', label: `${filters.rating.toFixed(1)}+`, remove: () => update({ ...filters, rating: 0 }) }] : []),
    ...(filters.photos ? [{ key: 'photos', label: 'With photos', remove: () => update({ ...filters, photos: false }) }] : []),
  ];
  const sorts = tab === 'dishes' ? DISH_SORTS : RESTAURANT_SORTS;
  const sortLabel = (sorts.find((s) => s.id === filters.sort) || sorts[0]).label;

  return (
    <div className="page">
      <div className="search-row">
        <BackButton fallback="/explore" />
        <SearchBar value={text} onChange={setText} onSubmit={submitSearch} />
        <button type="button" className="icon-btn dark badge-wrap" onClick={() => setShowFilters(true)} aria-label="Open filters">
          <SlidersHorizontal size={20} />{nFilters > 0 && <span className="notif">{nFilters}</span>}
        </button>
      </div>

      <Segmented
        options={[{ value: 'dishes', label: `Dishes (${dishes.loading ? '…' : dishes.total})` }, { value: 'restaurants', label: `Restaurants (${places.loading ? '…' : places.total})` }]}
        value={tab} onChange={(v) => update(filters, { tab: v === 'restaurants' ? 'restaurants' : '' })} className="seg-underline"
      />

      {chips.length > 0 && <div className="chips-scroll">{chips.map((c) => <Chip key={c.key} on onRemove={c.remove}>{c.label}</Chip>)}</div>}

      <div className="row between result-bar">
        <span className="muted small">
          {active.loading ? 'Searching…' : `${active.total} ${tab}`}{filters.q ? ` for "${filters.q}"` : ''}
          {nFilters > 0 && <> · <button type="button" className="link-orange" onClick={() => update({ ...DEFAULT_FILTERS, q: filters.q })}>Clear filters</button></>}
        </span>
        <label className="sort-select small">
          Sort: <b>{sortLabel}</b> <ChevronDown size={14} />
          <select value={sorts.some((s) => s.id === filters.sort) ? filters.sort : 'top'} onChange={(e) => update({ ...filters, sort: e.target.value })} aria-label="Sort results">
            {sorts.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {active.loading ? <ListSkeleton count={5} /> : active.error ? <ErrorState error={active.error} onRetry={active.reload} /> : active.items.length === 0 ? (
        <EmptyState
          icon={SearchX} title={tab === 'dishes' ? 'No dishes found' : 'No restaurants found'} text="Try a different word or remove some filters."
          action={<Button variant="outline" onClick={() => navigate(tab === 'dishes' ? '/results' : '/results?tab=restaurants')}>Reset search</Button>}
        />
      ) : (
        <>
          <div className="list-grid">
            {tab === 'dishes'
              ? active.items.map((d, i) => <DishRow key={d.dishId} dish={d} index={i} />)
              : active.items.map((r, i) => <RestaurantRow key={r.restaurantId} restaurant={r} index={i} />)}
          </div>
          {active.hasMore && <div className="center" style={{ marginTop: 16 }}><Button variant="outline" loading={active.loadingMore} onClick={active.loadMore}>Load more</Button></div>}
        </>
      )}

      <FiltersSheet
        open={showFilters} onClose={() => setShowFilters(false)} filters={filters}
        subtitle={filters.q ? `Results for "${filters.q}"` : undefined}
        onApply={(f) => { setShowFilters(false); update(f); }}
      />
    </div>
  );
}
