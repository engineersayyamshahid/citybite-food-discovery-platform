import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import ErrorState from '../../components/common/ErrorState';
import RatingSummary from '../../components/reviews/RatingSummary';
import ReviewList from '../../components/reviews/ReviewList';
import { ListSkeleton } from '../../components/loaders/Skeleton';
import useAsync from '../../hooks/useAsync';
import { browseService } from '../../services/browseService';
import { img } from '../../services/apiClient';
import NotFound from '../NotFound';

/** Reviews of one dish (GET /api/dishes/:id/reviews): rating bars, rank banner, customer photos and the review list. */
export default function DishReviews() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(() => browseService.dishReviews(id, 1), [id]);
  const [more, setMore] = useState({ items: [], page: 1, busy: false });

  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="page narrow-page"><ErrorState error={error} onRetry={reload} /></div>;
  if (loading || !data) return <div className="page narrow-page"><ListSkeleton count={3} /></div>;

  const reviews = [...data.reviews.items, ...more.items];
  const hasMore = reviews.length < data.reviews.total;
  const loadMore = async () => {
    setMore((m) => ({ ...m, busy: true }));
    try {
      const next = await browseService.dishReviews(id, more.page + 1);
      setMore((m) => ({ items: [...m.items, ...next.reviews.items], page: m.page + 1, busy: false }));
    } catch (e) {
      setMore((m) => ({ ...m, busy: false }));
    }
  };

  return (
    <div className="page narrow-page">
      <PageHeader title={data.dishName} fallback={`/dish/${id}`} />
      {data.reviewCount > 0 && <RatingSummary rating={data.avgRating} total={data.reviewCount} breakdown={data.breakdown} />}
      {data.rank && data.rankOutOf && (
        <div className="rank-banner"><Star size={16} /> #{data.rank} of {data.rankOutOf} {data.foodTypeName?.toLowerCase()} dishes in {data.city}</div>
      )}
      {data.customerPhotos.length > 0 && (
        <section>
          <h2 className="h-serif sub">Photos from customers</h2>
          <div className="photo-strip">{data.customerPhotos.map((p, i) => <img key={i} src={img(p)} alt="Customer food" loading="lazy" />)}</div>
        </section>
      )}
      <ReviewList reviews={reviews} hasMore={hasMore} loadingMore={more.busy} onLoadMore={loadMore} />
      <p className="muted small tip">Only customers with a printed bill can review. <Link to="/reviews/add" className="link-orange">Enter a bill code</Link></p>
    </div>
  );
}
