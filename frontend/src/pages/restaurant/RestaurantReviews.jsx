import { useState } from 'react';
import { Star } from 'lucide-react';
import RatingSummary from '../../components/reviews/RatingSummary';
import ReviewList from '../../components/reviews/ReviewList';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { ListSkeleton } from '../../components/loaders/Skeleton';
import useAsync from '../../hooks/useAsync';
import { myRestaurantService } from '../../services/myRestaurantService';

/** All reviews customers wrote for this restaurant's dishes (GET /api/my-restaurant/reviews, read only). */
export default function RestaurantReviews() {
  const { data, loading, error, reload } = useAsync(() => myRestaurantService.reviews(1), []);
  const [more, setMore] = useState({ items: [], page: 1, busy: false });

  if (loading) return <div className="page narrow-page"><ListSkeleton count={3} /></div>;
  if (error) return <div className="page narrow-page"><ErrorState error={error} onRetry={reload} /></div>;

  const reviews = [...data.reviews.items, ...more.items];
  const loadMore = async () => {
    setMore((m) => ({ ...m, busy: true }));
    try {
      const next = await myRestaurantService.reviews(more.page + 1);
      setMore((m) => ({ items: [...m.items, ...next.reviews.items], page: m.page + 1, busy: false }));
    } catch (e) { setMore((m) => ({ ...m, busy: false })); }
  };

  return (
    <div className="page narrow-page">
      <h1 className="h-serif">Ratings &amp; reviews</h1>
      {data.reviewCount > 0 ? (
        <>
          <RatingSummary rating={data.avgRating} total={data.reviewCount} breakdown={data.breakdown} />
          <ReviewList reviews={reviews} hasMore={reviews.length < data.reviews.total} loadingMore={more.busy} onLoadMore={loadMore} metaFor={(r) => `Verified bill · ${r.dishName}`} />
        </>
      ) : (
        <EmptyState icon={Star} title="No reviews yet" text="Customers can review after they get a bill with a review code. Generate a bill from the Bill tab." />
      )}
    </div>
  );
}
