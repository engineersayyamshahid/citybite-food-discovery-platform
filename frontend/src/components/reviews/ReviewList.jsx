import { useMemo, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import ReviewItem from './ReviewItem';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';

const SORTS = [
  { id: 'recent', label: 'Most recent' },
  { id: 'high', label: 'Highest rated' },
  { id: 'low', label: 'Lowest rated' },
];

/**
 * List of reviews with a sort menu and a "Load more" button.
 * Sorting applies to the reviews already loaded (the backend sends newest first).
 */
export default function ReviewList({ reviews, metaFor, hasMore, loadingMore, onLoadMore }) {
  const [sort, setSort] = useState('recent');
  const sorted = useMemo(() => {
    const copy = [...reviews];
    if (sort === 'high') return copy.sort((a, b) => b.rating - a.rating);
    if (sort === 'low') return copy.sort((a, b) => a.rating - b.rating);
    return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [reviews, sort]);

  if (!reviews.length) {
    return <EmptyState icon={MessageSquareText} title="No reviews yet" text="Reviews appear here after customers rate their bill." />;
  }
  return (
    <div>
      <div className="sort-row">
        <label htmlFor="rsort" className="muted small">Sort by</label>
        <select id="rsort" className="select-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div className="review-list">
        {sorted.map((r) => <ReviewItem key={r.reviewId} review={r} meta={metaFor?.(r)} />)}
      </div>
      {hasMore && <div className="center" style={{ marginTop: 14 }}><Button variant="outline" loading={loadingMore} onClick={onLoadMore}>Load more reviews</Button></div>}
    </div>
  );
}
