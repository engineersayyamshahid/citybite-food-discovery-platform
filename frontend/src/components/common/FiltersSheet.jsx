import { useEffect, useState } from 'react';
import Sheet from './Sheet';
import Chip from './Chip';
import Segmented from './Segmented';
import Button from './Button';
import useApp from '../../hooks/useApp';
import { browseService } from '../../services/browseService';
import { DEFAULT_FILTERS } from '../../utils/filters';
import { DISH_SORTS, PRICE_BUCKETS } from '../../utils/constants';

const RATINGS = [{ value: 0, label: 'Any' }, { value: 3.5, label: '3.5+' }, { value: 4, label: '4.0+' }, { value: 4.5, label: '4.5+' }];

/**
 * The Filters popup (sort, cuisine, price per dish, dish rating).
 * Edits a local copy; nothing changes until the person taps "Show N dishes".
 * The N is asked from the backend while you change filters.
 */
export default function FiltersSheet({ open, onClose, filters, onApply, subtitle }) {
  const { cuisines } = useApp();
  const [draft, setDraft] = useState(filters);
  const [count, setCount] = useState(null);
  useEffect(() => { if (open) setDraft(filters); }, [open, filters]);

  // ask the backend how many dishes match (waits a moment while the person is still tapping)
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setCount(null);
    const t = setTimeout(() => {
      browseService.dishes(draft, { pageSize: 1 }).then((r) => { if (!cancelled) setCount(r.total); }).catch(() => { if (!cancelled) setCount(-1); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [open, draft]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const toggleCuisine = (id) => set({ cuisines: draft.cuisines.includes(id) ? draft.cuisines.filter((x) => x !== id) : [...draft.cuisines, id] });
  const label = count === null ? 'Counting...' : count === -1 ? 'Show results' : count === 0 ? 'No dishes match' : `Show ${count} ${count === 1 ? 'dish' : 'dishes'}`;

  return (
    <Sheet
      open={open} onClose={onClose} title="Filters" subtitle={subtitle}
      footer={
        <div className="row gap">
          <Button variant="outline" onClick={() => setDraft({ ...DEFAULT_FILTERS, q: draft.q })}>Reset</Button>
          <Button block onClick={() => onApply(draft)} disabled={count === 0}>{label}</Button>
        </div>
      }
    >
      <div className="filter-block">
        <h3>Sort by</h3>
        <div className="chips-wrap">{DISH_SORTS.map((s) => <Chip key={s.id} on={draft.sort === s.id} onClick={() => set({ sort: s.id })}>{s.label}</Chip>)}</div>
      </div>
      <div className="filter-block">
        <div className="row between"><h3>Cuisine</h3>{draft.cuisines.length > 0 && <span className="orange small">{draft.cuisines.length} selected</span>}</div>
        <div className="chips-wrap">{cuisines.map((c) => <Chip key={c.cuisineId} on={draft.cuisines.includes(c.cuisineId)} onClick={() => toggleCuisine(c.cuisineId)}>{c.name}</Chip>)}</div>
      </div>
      <div className="filter-block">
        <h3>Price per dish</h3>
        <Segmented options={PRICE_BUCKETS.map((b) => ({ value: b.id, label: b.label }))} value={draft.price} onChange={(v) => set({ price: v })} className="seg-compact" />
      </div>
      <div className="filter-block">
        <h3>Dish rating</h3>
        <Segmented options={RATINGS} value={draft.rating} onChange={(v) => set({ rating: v })} />
      </div>
      <div className="filter-block">
        <Chip on={draft.photos} onClick={() => set({ photos: !draft.photos })}>With photos</Chip>
      </div>
    </Sheet>
  );
}
