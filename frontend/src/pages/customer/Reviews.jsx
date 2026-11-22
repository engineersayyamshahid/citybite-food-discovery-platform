import { Link } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import SmartImage from '../../components/common/SmartImage';
import Stars from '../../components/common/Stars';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import { ListSkeleton } from '../../components/loaders/Skeleton';
import usePaged from '../../hooks/usePaged';
import { meService } from '../../services/meService';
import { img } from '../../services/apiClient';
import { shortDate } from '../../utils/helpers';

/** The customer's own past reviews (GET /api/me/reviews) + the "Add review" button (bill-code flow starts here). */
export default function Reviews() {
  const list = usePaged((page) => meService.myReviews(page), []);

  return (
    <div className="page">
      <div className="row between">
        <h1 className="h-serif">Reviews</h1>
        <Link to="/reviews/add" className="btn btn-primary"><Plus size={18} /> Add review</Link>
      </div>
      <p className="eyebrow">Your reviews ({list.loading ? '…' : list.total})</p>
      {list.loading ? <ListSkeleton count={3} /> : list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : list.items.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" text="After you eat, enter the code printed on your bill to rate your dishes." action={<Link to="/reviews/add" className="btn btn-primary">Add your first review</Link>} />
      ) : (
        <>
          <div className="list-grid">
            {list.items.map((r, i) => (
              <motion.div key={r.reviewId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.05 }}>
                <Link to={`/dish/${r.dishId}`} className="my-review card hoverable">
                  <div className="row gap-sm top">
                    <SmartImage src={img(r.dishPhotoUrl)} alt="" className="rest-thumb" />
                    <div className="grow"><b>{r.dishName}</b><p className="muted small">{r.restaurantName}</p></div>
                    <Stars value={r.rating} size={13} />
                  </div>
                  {r.comment && <p className="review-text">{r.comment}</p>}
                  {r.photos?.length > 0 && <div className="review-photos">{r.photos.map((p, k) => <img key={k} src={img(p)} alt="Your food" />)}</div>}
                  <p className="muted xs">{shortDate(r.createdAt)}</p>
                </Link>
              </motion.div>
            ))}
          </div>
          {list.hasMore && <div className="center" style={{ marginTop: 16 }}><Button variant="outline" loading={list.loadingMore} onClick={list.loadMore}>Load more</Button></div>}
        </>
      )}
    </div>
  );
}
